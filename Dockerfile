FROM node:16.14.2
WORKDIR "/mnt/linky/"

ADD package.json "/mnt/linky/package.json"
ADD package-lock.json "/mnt/linky/package-lock.json"
ADD main.js "/mnt/linky/main.js"

ENV NODE_ENV=production
ENV FREE_USER="A REMPLIR"
ENV FREE_PASS="A REMPLIR"
ENV UP="A REMPLIR"
ENV AT="A REMPLIR"
ENV RT="A REMPLIR"

RUN npm install

ENTRYPOINT npm run system