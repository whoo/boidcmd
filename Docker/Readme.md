# Docker

'''
docker build -t boinc:latest .
docker run -d -e EMAIL=yourboidemail.com -e EMAIL_PASS=PASS -h nodename --name dockername boinc
'''

or
'''
docker run -it -e EMAIL=yourboidemail.com -e EMAIL_PASS=PASS -h nodename --name dockername boinc
'''


# Warning:
- Cannot register same cpuid ... cpuid >> will get same wcpu (need to confirm)




