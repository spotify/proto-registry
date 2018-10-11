package main

import (
	"encoding/json"
	"fmt"
	"github.com/golang/protobuf/proto"
	"github.com/golang/protobuf/protoc-gen-go/descriptor"
	"github.com/urfave/cli"
	"google.golang.org/genproto/protobuf/api"
	"google.golang.org/genproto/protobuf/ptype"
	"google.golang.org/genproto/protobuf/source_context"
	"io/ioutil"
	"log"
	"os"
)

type output struct {
	Types   []*ptype.Type   `json:"type"`
	Enums   []*ptype.Enum   `json:"enum"`
	Options []*ptype.Option `json:"option"`
	Apis    []*api.Api      `json:"api"`
}

type context struct {
	scope    string
	fileName string
	syntax   ptype.Syntax
}

func main() {
	app := cli.NewApp()

	var inputPath, outputPath string
	app.Name = "proto-type-index"
	app.Usage = "Converts a protobuf FileDescriptorSet into Type objects"
	app.Flags = []cli.Flag{
		cli.StringFlag{
			Name:        "input, i",
			Usage:       "the input file containing a FileDescriptorSet",
			Destination: &inputPath,
		},
		cli.StringFlag{
			Name: "output, o",
			Usage: "the output file pattern where '{name}' will be substituted with the " +
				"type name, and '{kind}' will be substituted with one of 'type', 'enum', " +
				"'option' or 'api'",
			Destination: &outputPath,
		},
	}
	app.Action = func(c *cli.Context) error {
		if len(inputPath) == 0 {
			log.Fatalln("no input file specified")
		}
		if len(outputPath) == 0 {
			log.Fatalln("no input file specified")
		}

		in, err := ioutil.ReadFile(inputPath)
		if err != nil {
			log.Fatalln("error reading input file:", err)
		}

		fds := &descriptor.FileDescriptorSet{}
		if err := proto.Unmarshal(in, fds); err != nil {
			log.Fatalln("failed to parse file descriptor set:", err)
		}

		output := new(output)
		if err := buildFileSetTypes(fds, output); err != nil {
			log.Fatalln("failed to build API descriptions:", err)
		}

		data, err := json.Marshal(output)
		if err != nil {
			log.Fatalln("failed to serialize result to JSON:", err)
		}

		log.Println("result:", string(data))

		return nil
	}

	err := app.Run(os.Args)
	if err != nil {
		log.Fatalln(err)
	}
}

func buildFileSetTypes(fds *descriptor.FileDescriptorSet, output *output) error {
	for _, file := range fds.File {
		if err := buildFileTypes(file, output); err != nil {
			return err
		}
	}
	return nil
}

func buildFileTypes(file *descriptor.FileDescriptorProto, output *output) error {
	syntax, err := buildSyntax(file.Syntax)
	if err != nil {
		return err
	}

	for _, message := range file.MessageType {
		err := buildMessageTypes(file.Package, file.Name, syntax, message, output)

		if err != nil {
			return err
		}
	}

	for _, enum := range file.EnumType {
		err := buildEnumTypes(file.Package, file.Name, syntax, enum, output)

		if err != nil {
			return err
		}
	}
	return nil
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

func buildMessageTypes(scope *string, fileName *string, syntax ptype.Syntax, message *descriptor.DescriptorProto, output *output) error {

	fields := make([]*ptype.Field, 0, len(message.Field))
	fields, err := buildMessageFields(message.Field, fields)
	if err != nil {
		return err
	}

	options := make([]*ptype.Option, 0)
	options, err = buildMessageOptions(message.Options, options)
	if err != nil {
		return err
	}

	oneofs := make([]string, 0, len(message.OneofDecl))
	oneofs, err = buildMessageOneofs(message.OneofDecl, oneofs)
	if err != nil {
		return err
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
		buildMessageTypes(&name, fileName, syntax, nestedMessage, output)
	}

	return nil
}

func buildMessageFields(fields []*descriptor.FieldDescriptorProto, output []*ptype.Field) ([]*ptype.Field, error) {
	for _, field := range fields {
		result, err := buildMessageField(field)

		if err != nil {
			return nil, err
		}

		output = append(output, result)
	}
	return output, nil
}

func buildMessageField(field *descriptor.FieldDescriptorProto) (*ptype.Field, error) {
	var oneofIndex int32 = 0
	if field.OneofIndex != nil {
		oneofIndex = *field.OneofIndex + 1
	}

	var typeUrl string
	if field.TypeName != nil {
		typeUrl = fmt.Sprintf("type.googleapis.com/%s", *field.TypeName)
	}

	options := make([]*ptype.Option, 0)
	options, err := buildFieldOptions(field.Options, options)
	if err != nil {
		return nil, err
	}

	result := &ptype.Field{
		Kind:         ptype.Field_Kind(field.GetType()),
		Cardinality:  ptype.Field_Cardinality(field.GetLabel()),
		Number:       field.GetNumber(),
		Name:         field.GetName(),
		TypeUrl:      typeUrl,
		OneofIndex:   oneofIndex,
		Packed:       field.Options.GetPacked(),
		Options:      options,
		JsonName:     field.GetJsonName(),
		DefaultValue: field.GetDefaultValue(),
	}

	return result, nil
}

func buildFieldOptions(options *descriptor.FieldOptions, output []*ptype.Option) ([]*ptype.Option, error) {
	// TODO
	return output, nil
}

func buildMessageOneofs(oneofs []*descriptor.OneofDescriptorProto, output []string) ([]string, error) {
	// TODO
	return output, nil
}

func buildMessageOptions(options *descriptor.MessageOptions, output []*ptype.Option) ([]*ptype.Option, error) {
	// TODO
	return output, nil
}

func buildEnumTypes(scope *string, fileName *string, syntax ptype.Syntax, enum *descriptor.EnumDescriptorProto, output *output) error {
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
	// TODO
	return output, nil
}

func buildEnumOptions(options *descriptor.EnumOptions, output []*ptype.Option) ([]*ptype.Option, error) {
	// TODO
	return output, nil
}
