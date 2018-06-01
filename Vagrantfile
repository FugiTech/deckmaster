Vagrant.configure('2') do |config|

  config.vm.hostname = 'deckmaster'
  config.vm.box = 'ubuntu/xenial64'

  config.vm.synced_folder './', '/vagrant'

  config.vm.network :forwarded_port, guest: 9000, host: 9000
  config.vm.network :forwarded_port, guest: 9001, host: 9001

  config.vm.provision :shell do |shell|
    shell.inline = <<-SHELL
      add-apt-repository ppa:gophers/archive
      curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
      echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
      apt-get update
      apt-get install golang-1.10-go yarn zip
    SHELL
  end

end
