# Proto registry

This is an implementation of a Protobuf schema registry.  Right now, the implementation is fairly
basic and focuses on the documentation aspects of a registry.

## Docker image

This repository builds a docker image that can be used to generate a Protobuf registry for any
set of schemas.

For example, using Google Cloud Build, put this in your `cloudbuild.yaml`:

```yaml
steps:
  - name: 'gcr.io/<tbd>/proto-registry:<version>'
    envs:
      INPUT: 'schema.fds.pb' # path to a binary Protobuf file containing a FileDescriptorSet
      OUTPUT: 'registry' # path to a directory where a Dockerfile + data should be put
  - name: 'gcr.io/cloud-builders/docker'
    args: [ 'build', '-t', 'gcr.io/$PROJECT_ID/registry', 'registry' ]
```

## Development

Right now, the building process is a bit hacky.  It assumes that there is a file in
`src/schema/schema.pb` containing a `FileDescriptorSet` containing the schema to be browsed.  You
can generate that file by running this command on some arbitrary protobufs:

    protoc --include_imports --include_source_info \
      -o path/to/src/schema/schema.pb \
      -I dir dir/**/*.proto

After that, simply run the usual:

    yarn
    yarn start

## Design considerations

The registry responds to resources at `/<type name>` only.  This matches the API of the
[`Any`][Any] type (even though the registry currently doesn't respond with a [`Type`][Type] object
if requested).  The idea is that the registry should respond with documentation when requested (e.g.
when the request specifies `Accept: text/html` or similar) and with a [`Type`][Type] otherwise.

[Any]: https://developers.google.com/protocol-buffers/docs/reference/google.protobuf#google.protobuf.Any
[Type]: https://developers.google.com/protocol-buffers/docs/reference/google.protobuf#google.protobuf.Type
