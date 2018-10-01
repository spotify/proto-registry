# Proto registry

This is an implementation of a Protobuf schema registry.  Right now, the implementation is fairly
basic and focuses on the documentation aspects of a registry.

## Action container

This repository builds an action container that can be used to generate a Protobuf registry for any
set of schemas.

Add this action:

```yaml
  - action: 'gcr.io/action-containers/proto-registry:<version>'
    envs:
      INPUT: # path to a binary Protobuf file containing a FileDescriptorSet
      OUTPUT: # path to a directory where a Dockerfile + data should be put
  - action: 'gcr.io/action-containers/bash-docker-tugboat:<version>'
    args: ['--deploy']
    envs:
      # Matching parameters to deploy the OUTPUT directory above
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
