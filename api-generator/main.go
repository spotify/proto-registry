/* Copyright 2018 Spotify AB. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package main

import (
	"fmt"
	"github.com/golang/protobuf/proto"
	"github.com/golang/protobuf/protoc-gen-go/descriptor"
	"github.com/golang/protobuf/ptypes"
	"github.com/golang/protobuf/ptypes/wrappers"
	"github.com/pkg/errors"
	"github.com/urfave/cli"
	"google.golang.org/genproto/protobuf/api"
	"google.golang.org/genproto/protobuf/ptype"
	"google.golang.org/genproto/protobuf/source_context"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"strings"
)

type output struct {
	Types []*ptype.Type
	Enums []*ptype.Enum
	Apis  []*api.Api
}

func main() {
	app := cli.NewApp()

	var inputPath, outputPath string
	app.Name = "api-generator"
	app.Usage = "Converts a protobuf FileDescriptorSet into Type (et al) objects"
	app.Flags = []cli.Flag{
		cli.StringFlag{
			Name:        "input, i",
			Usage:       "the input file containing a FileDescriptorSet",
			Destination: &inputPath,
		},
		cli.StringFlag{
			Name:        "output, o",
			Usage:       "the output file pattern where '{name}' will be substituted with the type name",
			Destination: &outputPath,
		},
	}
	app.Action = func(c *cli.Context) error {
		if len(inputPath) == 0 {
			return errors.Errorf("no input file specified")
		}
		if len(outputPath) == 0 {
			return errors.Errorf("no output file specified")
		}

		in, err := ioutil.ReadFile(inputPath)
		if err != nil {
			return errors.Wrapf(err, "error reading input file %s", inputPath)
		}

		fds := &descriptor.FileDescriptorSet{}
		if err := proto.Unmarshal(in, fds); err != nil {
			return errors.Wrapf(err, "failed to parse file descriptor set")
		}

		output := new(output)
		if err := buildFileSetTypes(fds, output); err != nil {
			return errors.Wrap(err, "failed to build API descriptions")
		}

		if err := emit(outputPath, output); err != nil {
			return errors.Wrapf(err, "failed to emit output to %s", outputPath)
		}

		return nil
	}

	err := app.Run(os.Args)
	if err != nil {
		log.Fatalln(err)
	}
}

func emit(outputPath string, output *output) error {
	for _, ty := range output.Types {
		typePath := strings.Replace(outputPath, "{name}", ty.Name, -1)
		out, err := proto.Marshal(ty)
		if err != nil {
			return errors.Wrapf(err, "could not marshal type %s", ty.Name)
		}
		if err := writeData(typePath, out); err != nil {
			return errors.Wrapf(err, "could not write type %s to %s", ty.Name, typePath)
		}
	}

	for _, apiTy := range output.Apis {
		typePath := strings.Replace(outputPath, "{name}", apiTy.Name, -1)
		out, err := proto.Marshal(apiTy)
		if err != nil {
			return errors.Wrapf(err, "could not marshal API %s", apiTy.Name)
		}
		if err := writeData(typePath, out); err != nil {
			return errors.Wrapf(err, "could not write API %s to %s", apiTy.Name, typePath)
		}
	}

	for _, enumTy := range output.Enums {
		typePath := strings.Replace(outputPath, "{name}", enumTy.Name, -1)
		out, err := proto.Marshal(enumTy)
		if err != nil {
			return errors.Wrapf(err, "could not marshal enum %s", enumTy.Name)
		}
		if err := writeData(typePath, out); err != nil {
			return errors.Wrapf(err, "could not write enum %s to %s", enumTy.Name, typePath)
		}
	}

	return nil
}

func writeData(path string, out []byte) error {
	dir := filepath.Dir(path)

	if err := os.MkdirAll(dir, 0755); err != nil {
		return errors.Wrapf(err, "could not create directory at %s", dir)
	}

	if err := ioutil.WriteFile(path, out, 0644); err != nil {
		return errors.Wrapf(err, "could not write %s", path)
	}

	return nil
}

func buildFileSetTypes(fds *descriptor.FileDescriptorSet, output *output) error {
	for _, file := range fds.File {
		if err := buildFileTypes(file, output); err != nil {
			return errors.Wrapf(err, "could not process proto file %s", *file.Name)
		}
	}
	return nil
}

func buildFileTypes(file *descriptor.FileDescriptorProto, output *output) error {
	syntax, err := buildSyntax(file.Syntax)
	if err != nil {
		return errors.Wrap(err, "could not determine file syntax")
	}

	for _, message := range file.MessageType {
		err := buildMessageType(file.Package, file.Name, syntax, message, output)

		if err != nil {
			return errors.Wrapf(err, "could not process message %s", *message.Name)
		}
	}

	for _, enum := range file.EnumType {
		err := buildEnumType(file.Package, file.Name, syntax, enum, output)

		if err != nil {
			return errors.Wrapf(err, "could not process enum %s", *enum.Name)
		}
	}

	for _, service := range file.Service {
		err := buildService(file.Package, file.Name, syntax, service, output)

		if err != nil {
			return errors.Wrapf(err, "could not process service %s", *service.Name)
		}
	}

	extensions := make([]*ptype.Field, 0)
	for _, extension := range file.Extension {
		extensions, err = buildExtension(file.Package, file.Name, syntax, extension, extensions)

		if err != nil {
			return errors.Wrapf(err, "could not process extension %s", *extension.Name)
		}
	}
	// TODO not sure how to use the extensions at this point

	options := make([]*ptype.Option, 0)
	options, err = buildFileOptions(file.Options, options)
	if err != nil {
		return errors.Wrap(err, "could not process file options")
	}

	return nil
}

func buildFileOptions(options *descriptor.FileOptions, output []*ptype.Option) ([]*ptype.Option, error) {
	if options == nil {
		return output, nil
	}

	if options.JavaPackage != nil {
		option, err := buildStringOption("java_package", *options.JavaPackage)
		if err != nil {
			return nil, err
		}

		output = append(output, option)
	}

	if options.JavaOuterClassname != nil {
		option, err := buildStringOption("java_outer_classname", *options.JavaOuterClassname)
		if err != nil {
			return nil, err
		}

		output = append(output, option)
	}

	if options.JavaMultipleFiles != nil {
		option, err := buildBoolOption("java_multiple_files", *options.JavaMultipleFiles)
		if err != nil {
			return nil, err
		}

		output = append(output, option)
	}

	if options.JavaGenerateEqualsAndHash != nil {
		option, err := buildBoolOption("java_generate_equals_and_hash", *options.JavaGenerateEqualsAndHash)
		if err != nil {
			return nil, err
		}

		output = append(output, option)
	}

	if options.JavaStringCheckUtf8 != nil {
		option, err := buildBoolOption("java_string_check_utf8", *options.JavaStringCheckUtf8)
		if err != nil {
			return nil, err
		}

		output = append(output, option)
	}

	if options.OptimizeFor != nil {
		option, err := buildInt32Option("optimize_for", int32(*options.OptimizeFor))
		if err != nil {
			return nil, err
		}

		output = append(output, option)
	}

	if options.GoPackage != nil {
		option, err := buildStringOption("go_package", *options.GoPackage)
		if err != nil {
			return nil, err
		}

		output = append(output, option)
	}

	if options.CcGenericServices != nil {
		option, err := buildBoolOption("cc_generic_services", *options.CcGenericServices)
		if err != nil {
			return nil, err
		}

		output = append(output, option)
	}

	if options.JavaGenericServices != nil {
		option, err := buildBoolOption("java_generic_services", *options.JavaGenericServices)
		if err != nil {
			return nil, err
		}

		output = append(output, option)
	}

	if options.PyGenericServices != nil {
		option, err := buildBoolOption("py_generic_services", *options.PyGenericServices)
		if err != nil {
			return nil, err
		}

		output = append(output, option)
	}

	if options.PhpGenericServices != nil {
		option, err := buildBoolOption("php_generic_services", *options.PhpGenericServices)
		if err != nil {
			return nil, err
		}

		output = append(output, option)
	}

	if options.Deprecated != nil {
		option, err := buildBoolOption("deprecated", *options.Deprecated)
		if err != nil {
			return nil, err
		}

		output = append(output, option)
	}

	if options.CcEnableArenas != nil {
		option, err := buildBoolOption("cc_enable_arenas", *options.CcEnableArenas)
		if err != nil {
			return nil, err
		}

		output = append(output, option)
	}

	if options.ObjcClassPrefix != nil {
		option, err := buildStringOption("objc_class_prefix", *options.ObjcClassPrefix)
		if err != nil {
			return nil, err
		}

		output = append(output, option)
	}

	if options.CsharpNamespace != nil {
		option, err := buildStringOption("csharp_namespace", *options.CsharpNamespace)
		if err != nil {
			return nil, err
		}

		output = append(output, option)
	}

	if options.SwiftPrefix != nil {
		option, err := buildStringOption("swift_prefix", *options.SwiftPrefix)
		if err != nil {
			return nil, err
		}

		output = append(output, option)
	}

	if options.PhpClassPrefix != nil {
		option, err := buildStringOption("php_class_prefix", *options.PhpClassPrefix)
		if err != nil {
			return nil, err
		}

		output = append(output, option)
	}

	if options.PhpNamespace != nil {
		option, err := buildStringOption("php_namespace", *options.PhpNamespace)
		if err != nil {
			return nil, err
		}

		output = append(output, option)
	}

	return output, nil
}

func buildSyntax(syntax *string) (ptype.Syntax, error) {
	if syntax == nil {
		return ptype.Syntax_SYNTAX_PROTO2, nil
	}

	switch *syntax {
	case "proto2":
		return ptype.Syntax_SYNTAX_PROTO2, nil
	case "proto3":
		return ptype.Syntax_SYNTAX_PROTO3, nil
	}
	return ptype.Syntax_SYNTAX_PROTO2, fmt.Errorf("unrecognized syntax %s", *syntax)
}

func buildMessageType(scope *string, fileName *string, syntax ptype.Syntax, message *descriptor.DescriptorProto, output *output) error {
	fields := make([]*ptype.Field, 0, len(message.Field))
	fields, err := buildMessageFields(message.Field, fields)
	if err != nil {
		return errors.Wrap(err, "could not process message fields")
	}

	options := make([]*ptype.Option, 0)
	options, err = buildMessageOptions(message.Options, options)
	if err != nil {
		return errors.Wrap(err, "could not process message options")
	}

	oneofs := make([]string, 0, len(message.OneofDecl))
	oneofs, err = buildMessageOneofs(message.OneofDecl, oneofs)
	if err != nil {
		return errors.Wrap(err, "could not process message oneofs")
	}

	name := fmt.Sprintf("%s.%s", *scope, *message.Name)
	result := &ptype.Type{
		Name:          name,
		Fields:        fields,
		Oneofs:        oneofs,
		Options:       options,
		SourceContext: &source_context.SourceContext{FileName: *fileName},
		Syntax:        syntax,
	}
	output.Types = append(output.Types, result)

	for _, nestedMessage := range message.NestedType {
		if err := buildMessageType(&name, fileName, syntax, nestedMessage, output); err != nil {
			return errors.Wrapf(err, "could not process nested message %s", *nestedMessage.Name)
		}
	}

	return nil
}

func buildMessageFields(fields []*descriptor.FieldDescriptorProto, output []*ptype.Field) ([]*ptype.Field, error) {
	for _, field := range fields {
		result, err := buildMessageField(field)

		if err != nil {
			return nil, errors.Wrapf(err, "could not process field %s", *field.Name)
		}

		output = append(output, result)
	}
	return output, nil
}

func buildMessageField(field *descriptor.FieldDescriptorProto) (*ptype.Field, error) {
	var oneofIndex int32
	if field.OneofIndex != nil {
		oneofIndex = *field.OneofIndex + 1
	}

	var typeURL string
	if field.TypeName != nil {
		typeURL = fmt.Sprintf("type.googleapis.com/%s", *field.TypeName)
	}

	options := make([]*ptype.Option, 0)
	options, err := buildFieldOptions(field.Options, options)
	if err != nil {
		return nil, errors.Wrap(err, "could not process field options")
	}

	kind := ptype.Field_TYPE_UNKNOWN
	if field.Type != nil {
		kind = ptype.Field_Kind(*field.Type)
	}

	cardinality := ptype.Field_CARDINALITY_UNKNOWN
	if field.Label != nil {
		cardinality = ptype.Field_Cardinality(*field.Label)
	}

	result := &ptype.Field{
		Kind:         kind,
		Cardinality:  cardinality,
		Number:       field.GetNumber(),
		Name:         field.GetName(),
		TypeUrl:      typeURL,
		OneofIndex:   oneofIndex,
		Packed:       field.Options.GetPacked(),
		Options:      options,
		JsonName:     field.GetJsonName(),
		DefaultValue: field.GetDefaultValue(),
	}

	return result, nil
}

func buildFieldOptions(options *descriptor.FieldOptions, output []*ptype.Option) ([]*ptype.Option, error) {
	if options == nil {
		return output, nil
	}

	if options.Ctype != nil {
		option, err := buildInt32Option("ctype", int32(*options.Ctype))
		if err != nil {
			return nil, err
		}

		output = append(output, option)
	}

	if options.Packed != nil {
		option, err := buildBoolOption("packed", *options.Packed)
		if err != nil {
			return nil, err
		}

		output = append(output, option)
	}

	if options.Jstype != nil {
		option, err := buildInt32Option("jstype", int32(*options.Jstype))
		if err != nil {
			return nil, err
		}

		output = append(output, option)
	}

	if options.Lazy != nil {
		option, err := buildBoolOption("lazy", *options.Lazy)
		if err != nil {
			return nil, err
		}

		output = append(output, option)
	}

	if options.Deprecated != nil {
		option, err := buildBoolOption("deprecated", *options.Deprecated)
		if err != nil {
			return nil, err
		}

		output = append(output, option)
	}

	if options.Weak != nil {
		option, err := buildBoolOption("weak", *options.Weak)
		if err != nil {
			return nil, err
		}

		output = append(output, option)
	}

	return output, nil
}

func buildMessageOneofs(oneofs []*descriptor.OneofDescriptorProto, output []string) ([]string, error) {
	for _, oneof := range oneofs {
		output = append(output, *oneof.Name)
	}

	return output, nil
}

func buildMessageOptions(options *descriptor.MessageOptions, output []*ptype.Option) ([]*ptype.Option, error) {
	if options == nil {
		return output, nil
	}

	if options.MessageSetWireFormat != nil {
		option, err := buildBoolOption("message_set_wire_format", *options.MessageSetWireFormat)
		if err != nil {
			return nil, err
		}

		output = append(output, option)
	}

	if options.NoStandardDescriptorAccessor != nil {
		option, err := buildBoolOption("no_standard_descriptor_accessor", *options.NoStandardDescriptorAccessor)
		if err != nil {
			return nil, err
		}

		output = append(output, option)
	}

	if options.Deprecated != nil {
		option, err := buildBoolOption("deprecated", *options.Deprecated)
		if err != nil {
			return nil, err
		}

		output = append(output, option)
	}

	if options.MapEntry != nil {
		option, err := buildBoolOption("map_entry", *options.MapEntry)
		if err != nil {
			return nil, err
		}

		output = append(output, option)
	}

	return output, nil
}

func buildEnumType(scope *string, fileName *string, syntax ptype.Syntax, enum *descriptor.EnumDescriptorProto, output *output) error {
	values := make([]*ptype.EnumValue, 0, len(enum.Value))
	values, err := buildEnumValues(enum.Value, values)
	if err != nil {
		return err
	}

	options := make([]*ptype.Option, 0)
	options, err = buildEnumOptions(enum.Options, options)
	if err != nil {
		return err
	}

	result := &ptype.Enum{
		Name:          fmt.Sprintf("%s.%s", *scope, *enum.Name),
		Enumvalue:     values,
		Options:       options,
		SourceContext: &source_context.SourceContext{FileName: *fileName},
		Syntax:        syntax,
	}
	output.Enums = append(output.Enums, result)

	return nil
}

func buildEnumValues(values []*descriptor.EnumValueDescriptorProto, output []*ptype.EnumValue) ([]*ptype.EnumValue, error) {
	for _, value := range values {
		result, err := buildEnumValue(value)

		if err != nil {
			return nil, errors.Wrapf(err, "could not process enum value %s", *value.Name)
		}

		output = append(output, result)
	}
	return output, nil
}

func buildEnumValue(value *descriptor.EnumValueDescriptorProto) (*ptype.EnumValue, error) {
	options := make([]*ptype.Option, 0)
	options, err := buildEnumValueOptions(value.Options, options)
	if err != nil {
		return nil, err
	}

	result := &ptype.EnumValue{
		Name:    value.GetName(),
		Number:  value.GetNumber(),
		Options: options,
	}

	return result, nil
}

func buildEnumValueOptions(options *descriptor.EnumValueOptions, output []*ptype.Option) ([]*ptype.Option, error) {
	if options == nil {
		return output, nil
	}

	if options.Deprecated != nil {
		option, err := buildBoolOption("deprecated", *options.Deprecated)
		if err != nil {
			return nil, err
		}

		output = append(output, option)
	}

	return output, nil
}

func buildEnumOptions(options *descriptor.EnumOptions, output []*ptype.Option) ([]*ptype.Option, error) {
	if options == nil {
		return output, nil
	}

	if options.AllowAlias != nil {
		option, err := buildBoolOption("allow_alias", *options.AllowAlias)
		if err != nil {
			return nil, err
		}

		output = append(output, option)
	}

	if options.Deprecated != nil {
		option, err := buildBoolOption("deprecated", *options.Deprecated)
		if err != nil {
			return nil, err
		}

		output = append(output, option)
	}

	return output, nil
}

func buildExtension(scope *string, filename *string, syntax ptype.Syntax, extension *descriptor.FieldDescriptorProto, output []*ptype.Field) ([]*ptype.Field, error) {
	field, err := buildMessageField(extension)
	if err != nil {
		return nil, err
	}

	output = append(output, field)

	return output, nil
}

func buildService(scope *string, filename *string, syntax ptype.Syntax, service *descriptor.ServiceDescriptorProto, output *output) error {
	// TODO
	return nil
}

func buildBoolOption(name string, value bool) (*ptype.Option, error) {
	any, err := ptypes.MarshalAny(&wrappers.BoolValue{Value: value})

	if err != nil {
		return nil, err
	}

	result := &ptype.Option{
		Name:  name,
		Value: any,
	}

	return result, nil
}

func buildInt32Option(name string, value int32) (*ptype.Option, error) {
	any, err := ptypes.MarshalAny(&wrappers.Int32Value{Value: value})

	if err != nil {
		return nil, err
	}

	result := &ptype.Option{
		Name:  name,
		Value: any,
	}

	return result, nil
}

func buildStringOption(name string, value string) (*ptype.Option, error) {
	any, err := ptypes.MarshalAny(&wrappers.StringValue{Value: value})

	if err != nil {
		return nil, err
	}

	result := &ptype.Option{
		Name:  name,
		Value: any,
	}

	return result, nil
}
