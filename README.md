# what-is-my-purpose

install serverless:  npm install -g serverless       

run local frontend (https, not needed):
openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem
http-server -S -c-1

run local frontend http - python3 -m http.server

run local server: serverless offline

deploy to dev: serverless deploy 
deploy to prod: serverless deploy  --stage production
