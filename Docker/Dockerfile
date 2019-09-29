## docker build -t boidc:latest .
## docker run -d -e EMAIL=yourboidemail.com -e EMAIL_PASS=PASS -h hostname --name hostname boidc
## if you want to check docker exec -it hostname bash 

FROM debian:latest
LABEL maintainer="whoo" \
      description="Intel BOINC client for BOID."

RUN apt update -y && apt install -y boinc-client jq curl netcat

EXPOSE  1234/tcp
COPY	register.* promotheus.sh /tmp/
RUN	apt-get autoremove -y && \
    	rm -rf /var/lib/apt/lists/*

USER boinc
RUN 	touch ~boinc/.bashrc

CMD 	(sleep 10; boinccmd --project_attach http://www.worldcommunitygrid.org/ 1061556_a0c611b081f8692b7ef0c11d39e6105c )& \
	(sleep 120; /tmp/register.sh $EMAIL $EMAIL_PASS ) & \
	/tmp/promotheus.sh & \
	/usr/bin/boinc --dir /var/lib/boinc-client --allow_remote_gui_rpc --suppress_net_info --allow_multiple_clients 
