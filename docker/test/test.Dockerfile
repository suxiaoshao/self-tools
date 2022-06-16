FROM suxiaoshao/rust:latest

RUN apk add zsh git openssl
# zsh 下载
RUN sed -i "s/ash/zsh/" /etc/passwd
COPY ./docker/test/install.sh /root/install/install.sh
RUN chmod 777 /root/install/install.sh
RUN /root/install/install.sh

# zsh 插件配置
ENTRYPOINT [ "/bin/zsh" ]
RUN cd $HOME/.oh-my-zsh/plugins
RUN git clone http://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
RUN git clone http://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
COPY ./docker/test/.zshrc /root/.zshrc

# cargo 配置
COPY ./docker/test/config.toml /usr/local/cargo
RUN cargo install cargo-watch
RUN cargo install cargo-cache

COPY ./server /app
VOLUME [ "/app/target","/usr/local/cargo/registry" ]