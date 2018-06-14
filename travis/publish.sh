#!/bin/bash
set -ev

echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin

export REPO=opla/backend

echo $TRAVIS_COMMIT
echo $TRAVIS_BRANCH

docker build -t $REPO:$TRAVIS_COMMIT .
docker push $REPO:$TRAVIS_COMMIT

if [ "${TRAVIS_PULL_REQUEST}" = "false" ]; then
	escaped_branch=$(echo $TRAVIS_BRANCH | tr / _)
	docker tag $REPO:$TRAVIS_COMMIT $REPO:$escaped_branch
	docker push $REPO:$escaped_branch
	if [ "${TRAVIS_BRANCH}" == "master" ]; then
		docker tag $REPO:$TRAVIS_COMMIT $REPO:latest
		docker push $REPO:latest
	fi
fi