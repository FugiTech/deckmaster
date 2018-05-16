package main

import (
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"os/exec"
	"strings"

	update "github.com/inconshreveable/go-update"
)

func autoUpdate() {
	resp, err := http.Get("https://deckmaster.fugi.io/version")
	if err != nil {
		log.Println(err)
		return
	}
	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		log.Println(err)
		return
	}
	if VERSION == strings.TrimSpace(string(body)) {
		log.Println(err)
		return
	}

	// OK we need to update
	resp, err = http.Get("https://deckmaster.fugi.io/deckmaster-windows-4.0-amd64.exe")
	if err != nil {
		log.Println(err)
		return
	}
	defer resp.Body.Close()
	err = update.Apply(resp.Body, update.Options{})
	if err != nil {
		log.Println(err)
		return
	}

	name, err := os.Executable()
	if err != nil {
		log.Println(err)
		return
	}

	err = exec.Command(name, os.Args[1:]...).Start()
	if err != nil {
		log.Println(err)
		return
	}

	os.Exit(0)
}
