FROM mhart/alpine-node:10

WORKDIR /opt
COPY . .
RUN yarn install

EXPOSE 8080
CMD ["yarn", "start"]
