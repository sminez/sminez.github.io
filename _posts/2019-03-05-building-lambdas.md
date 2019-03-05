---
title: Building Python Lambda Artifacts With Docker
published: true
comments: true
categories: python docker aws
---

A while ago I wrote my family a simple [Alexa][0] skill. It doesn't do that
much, mainly it tells my daughter what is on the school dinner menu and lets us
know whats on our combined calendars. Recently however, I started a new job and
with that job came a shiny new Macbook Pro.

On the one hand: yay! Macbook Pro!

On the other?

Now how do I bundle up my python app for deploying on _Linux_ based [AWS
Lambda][1]?...


## What's the problem?

As a bit of motivational backstory as to why this is a problem: to use any third
party python libraries in an AWS Lambda function, you need to bundle up your app
in a zip archive and upload that into AWS. This is fine for pure Python source
files but anything with a [C extension][2] you need to have the correct binary
for the target OS.

The problem? Pip installing something will pull down the package that is
appropriate for the OS that you are running. When I had a Linux machine I was
fine, now with my shiny new OSX based system I'm up a creek...


## A docker shaped paddle

Docker is a fantastic tool for this kind of problem: I don't really need a full
Linux system, just somewhere I can pip install my requirements and dump out a
zip file.

So, first we write a Dockerfile that will contain our Python 'build' environment:
```dockerfile
FROM ubuntu:bionic

RUN apt-get update -y --fix-missing
RUN apt-get install -y build-essential
RUN apt-get install -y software-properties-common
RUN apt-get install -y zip
RUN apt-get install -y python3  # python3.6 on bionic
RUN apt-get install -y python3-dev
RUN apt-get install -y python3-setuptools
RUN apt-get install -y python3-venv

#create code mount
ADD . /code
WORKDIR /code
```

Then we write a helper script that will build the archive:
```bash
#!/bin/bash

YELLOW='\033[1;33m'
NC='\033[0m'

TODAY=$(date "+%Y-%m-%d")

printf "${YELLOW}Creating build directory...${NC}\n"
cp -r src build

printf "${YELLOW}Installing requirements...${NC}\n"
mkdir -p /code/venv
python3.6 -m venv /code/venv/lambda
source /code/venv/lambda/bin/activate
pip install wheel
pip install -r requirements.txt

printf "${YELLOW}Creating archive...${NC}\n"
cd build
zip -r9 /code/build/lambda_${TODAY}.zip .
cd /code/venv/lambda/lib/python3.6/site-packages
zip -r9 /code/build/lambda_${TODAY}.zip .
cd /code/build
mv lambda_${TODAY}.zip ../
cd ../

printf "${YELLOW}Removing build artifacts...${NC}\n"
rm -rf build
rm -rf venv

printf "${YELLOW}Done${NC}\n"
```

And finally we build the image and with it our archive:
```bash
$ docker build -t lambda-builder .
$ docker run -i -t -v $PWD:/code lambda-builder ./build-zip.sh
```

Now we have our nice shiny zip file, ready for deployment to AWS Lambda!

  [0]: https://www.youtube.com/watch?v=t5bYtcjWcPQ
  [1]: https://aws.amazon.com/lambda/
  [2]: https://docs.python.org/3/extending/building.html
