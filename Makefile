app_dir = /srv/nodejs/bold
app_dir_dev = /srv/nodejs/bold_dev


install :
	sudo mkdir -p $(app_dir)
	sudo cp ./app.js $(app_dir)/app.js
	sudo cp ./package.json $(app_dir)/package.json
	sudo cp -r ./bin ./lib ./public ./routes ./node_modules ./views ./model $(app_dir)
	sudo cp ./bold.conf /etc/init/bold.conf

deploy :
	make install
	make start_app

start_app :
	sudo start  --no-wait -q bold || (sudo stop bold ; sudo start --no-wait -q bold)

install_dev :
	sudo mkdir -p $(app_dir_dev)
	sudo cp ./app.js $(app_dir_dev)/app.js
	sudo cp ./package.json $(app_dir_dev)/package.json
	sudo cp ./losses.json $(app_dir_dev)/losses.json
	sudo cp -r ./bin ./lib ./public ./routes ./node_modules ./views ./model $(app_dir_dev)
	sudo cp ./bold_dev.conf /etc/init/bold_dev.conf

deploy_dev :
	make install_dev
	make start_app_dev

start_app_dev :
	sudo start  --no-wait -q bold_dev || (sudo stop bold_dev ; sudo start --no-wait -q bold_dev)
