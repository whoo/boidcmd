## docker build -t boinc:latest .
## docker run -d -h testboid --name testboid boinc 
## docker exec -it testboid bash 

FROM debian
MAINTAINER Dominique <derrierdo?gmail.com>
RUN apt update -y && apt install -y nodejs wget boinc-client procps
USER boinc
RUN touch ~boinc/.bashrc
RUN wget -qO- https://raw.githubusercontent.com/creationix/nvm/v0.34.0/install.sh | bash
RUN . ~boinc/.bashrc && nvm install node
RUN . ~boinc/.bashrc && npm install boidcmd -g
CMD /usr/bin/boinc --dir /var/lib/boinc-client --allow_remote_gui_rpc
