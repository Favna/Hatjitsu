# Hatjitsu

Create disposable online [Planning Poker](http://en.wikipedia.org/wiki/Planning_poker) rooms for quick and easy estimations.

# Features

-   Simple interface
-   No login/signup required
-   Votes are kept hidden until all have voted to prevent coercion
-   'Observer feature' - watch the planning session without having to vote
-   Multiple planning card decks
-   Adaptive design allows to work on desktop, tablet and mobile

# Usage

This repo is designed to exclusively be ran in a Docker container

To start this image use:

```sh
docker-compose up -d
```

This will build the docker image and start it [on port 5608](http://localhost:5608)
