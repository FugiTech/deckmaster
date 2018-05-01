package main

import (
	"bufio"
	"io"
	"log"
	"os"
	"os/exec"
)

func main() {
	f, err := os.Open("test.log")
	if err != nil {
		log.Println("input err", err)
		return
	}
	defer f.Close()
	input := bufio.NewReader(f)

	// logFile := path.Join(os.Getenv("APPDATA"), "..", "LocalLow", "Wizards Of The Coast", "MTGA", "output_log.txt")
	logFile := "/mnt/c/Users/fugi_000/AppData/LocalLow/Wizards Of The Coast/MTGA/output_log.txt"
	output, err := os.Create(logFile)
	if err != nil {
		log.Println("output err", err)
		return
	}
	defer output.Close()

	userInput := make([]byte, 1)
	// disable input buffering
	exec.Command("stty", "-F", "/dev/tty", "cbreak", "min", "1").Run()
	// do not display entered characters on the screen
	exec.Command("stty", "-F", "/dev/tty", "-echo").Run()
	// restore the echoing state when exiting
	defer exec.Command("stty", "-F", "/dev/tty", "echo").Run()

	processing := true
	for processing {
		data, err := input.ReadBytes('{')
		if err != nil && err != io.EOF {
			log.Println("read err", err)
			return
		}
		processing = err != io.EOF

		_, err = output.Write(data)
		if err != nil {
			log.Println("log err", err)
			return
		}

		_, err = os.Stdout.Write(data)
		if err != nil {
			log.Println("terminal err", err)
			return
		}

		os.Stdin.Read(userInput)
	}
}
