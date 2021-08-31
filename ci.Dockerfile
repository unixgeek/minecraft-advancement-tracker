FROM rust:1.51.0-slim-buster

RUN apt-get update \
    && echo "root:root" | chpasswd \
    # Workaround update-alternatives issue
    && mkdir -p /usr/share/man/man1 \
    && apt-get install -y pkg-config librust-openssl-dev git openjdk-11-jre-headless curl \
    && cargo install wasm-pack \
    && rustup target add wasm32-unknown-unknown \
    && curl https://nodejs.org/dist/v14.17.0/node-v14.17.0-linux-x64.tar.xz | tar -C /root -x -J -f -

CMD ["/bin/sh"]