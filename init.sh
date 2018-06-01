if ! grep -q Microsoft /proc/version; then
  echo "Deckmaster development must occur on WSL. See README for details."
  exit 1
fi

if command -v vagrant 2>/dev/null; then
  wget https://releases.hashicorp.com/vagrant/2.1.1/vagrant_2.1.1_x86_64.deb
  sudo dpkg -i vagrant_2.1.1_x86_64.deb
  rm vagrant_2.1.1_x86_64.deb
fi

export PATH="$PATH:/mnt/c/Program Files/Oracle/VirtualBox"
export VAGRANT_WSL_ENABLE_WINDOWS_ACCESS="1"

vagrant up
vagrant ssh
