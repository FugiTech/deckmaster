package main

import (
	"errors"
	"os"
	"path/filepath"

	"github.com/hpcloud/tail"
)

func (svc *service) tail() error {
	outputLogLocation := filepath.Join(os.Getenv("APPDATA"), "..", "LocalLow", "Wizards Of The Coast", "MTGA", "output_log.txt")
	t, err := tail.TailFile(outputLogLocation, tail.Config{
		ReOpen: true,
		Poll:   true,
		Follow: true,
		Logger: svc.logger,
	})
	if err != nil {
		svc.arenaStatus.Store("Unable to read log")
		return err
	}

	for {
		select {
		case <-svc.ctx.Done():
			t.Stop()
			return nil
		case line, ok := <-t.Lines:
			if line != nil {
				svc.pipe.WriteString(line.Text + "\n")
			}
			if !ok {
				svc.arenaStatus.Store("Unable to read log")
				return errors.New("Tail.Lines closed unexpectedly")
			}
		}
	}

	// return t.Wait()
}
