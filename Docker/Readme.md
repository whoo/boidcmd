# Docker

```bash
docker build -t boinc:latest .
docker run -d -e EMAIL=yourboidemail.com -e EMAIL_PASS=password -h nodename --name dockername boinc
```
or
```
docker run -it -e EMAIL=yourboidemail.com -e EMAIL_PASS=PASS -h nodename --name dockername boinc
```

I try to reduce size of the container.
* boinc-client (install a lot of stuff/python/...)
* simple bash script with jq to parse json and submit request


# Warning:
- Cannot register same cpuid ... cpuid >> will get same wcpu (need to confirm)
- be careful with password and "

# Todo:
Clean debian after install


