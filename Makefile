# Container image name.
IMAGE := proto-registry-builder

# Where to push the final Docker image.
REGISTRY := spotify/$(IMAGE)

# Determine version strategy.
CIRCLE_BUILD_NUM ?= "0"
TAG := 0.1.$(CIRCLE_BUILD_NUM)

# Set build directories.
BUILD_OUTPUT := build_output
TEST_DATA_DIR := testdata

# Utility container to use.
UTIL_CONTAINER := alpine:3.8

#
# Build targets.
#
all: review

release: push 

review: build  

build: testdata
	@echo ">> Building: $(IMAGE)"
	@docker build -t $(REGISTRY):$(TAG) .                                  
	@docker run                                                                 \
		-i                                                                  \
		--rm                                                                \
		-v "$$(pwd)/$(TEST_DATA_DIR):/testdata"                             \
		-v "$$(pwd)/$(BUILD_OUTPUT):/build_output"                          \
		$(REGISTRY):$(TAG)                                                  \
		-i /testdata/testdata.fds.pb -o /build_output

testdata: build-dirs
	@echo ">> Starting container to extract $@ in"
	@docker run                                                                 \
		-i                                                                  \
		--rm                                                                \
		-v "$$(pwd)/testdata.fds.pb.gz:/testdata.fds.pb.gz"                 \
		-v "$$(pwd)/$(TEST_DATA_DIR):/testdata"                             \
		$(UTIL_CONTAINER)                                                   \
		/bin/sh -c "                                                        \
			gunzip -c /testdata.fds.pb.gz > /testdata/testdata.fds.pb   \
		"

build-testdata: 
	@echo ">> Starting container to generate testdata"
	@docker run                                                                 \
		-i                                                                  \
		--rm                                                                \
		-v "$$(pwd):/output"                                                \
		$(UTIL_CONTAINER)                                                   \
		/bin/sh -c "                                                        \
			apk add --update                                            \
				protobuf                                            \
				git                                              && \
			git clone --depth 1                                         \
				https://github.com/protocolbuffers/protobuf.git     \
				protobuf                                         && \
			cd protobuf/src                                          && \
			protoc --include_imports --include_source_info              \
				-o testdata.fds.pb                                  \
				-I . google/protobuf/*.proto                     && \
			gzip -c testdata.fds.pb > /output/testdata.fds.pb.gz        \
		"

push: build Dockerfile
	@docker push $(REGISTRY):$(TAG)
	@echo ">> Pushed: $(REGISTRY):$(TAG)"

build-dirs:
	@mkdir -p $(BUILD_OUTPUT)
	@mkdir -p $(TEST_DATA_DIR)

clean:  
	rm -rf $(BUILD_OUTPUT)
	rm -rf $(TEST_DATA_DIR)

.PHONY: all build build-testdata clean testdata
