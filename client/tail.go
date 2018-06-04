package main

import (
	"bytes"
	"io"
	"os"
	"path/filepath"
	"time"
)

const maxReadSize = 3 * 1024 * 1024

func (svc *service) tail() error {
	outputLogLocation := filepath.Join(os.Getenv("APPDATA"), "..", "LocalLow", "Wizards Of The Coast", "MTGA", "output_log.txt")
	svc.logger.Println("Output log location:", outputLogLocation)
	for {
		if svc.ctx.Err() != nil {
			return svc.ctx.Err()
		}

		f, err := os.Open(outputLogLocation)
		if err != nil {
			svc.arenaStatus.Store("Log file does not exist")
			svc.logger.Println("Error opening log file:", err)
			time.Sleep(5 * time.Second)
			continue
		}
		fi, err := os.Stat(outputLogLocation)
		if err != nil {
			f.Close()
			svc.arenaStatus.Store("Log file does not exist")
			svc.logger.Println("Error statting log file:", err)
			time.Sleep(5 * time.Second)
			continue
		}
		if fi.Size() > maxReadSize {
			f.Seek(-maxReadSize, os.SEEK_END)
		}

		done := make(chan struct{})
		go func() {
			select {
			case <-done:
			case <-svc.ctx.Done():
				f.Close()
			}
		}()

		for {
			fi2, err := os.Stat(outputLogLocation)
			if err != nil {
				svc.logger.Println("Error statting log file:", err)
				break
			}
			if fi.Size() > fi2.Size() {
				svc.logger.Println("Log file truncated")
				break
			}
			fi = fi2

			svc.pipeLock.Lock()
			if svc.pipe.Cap() > maxReadSize {
				var b bytes.Buffer
				_, err = io.Copy(&b, &svc.pipe)
				if err == nil {
					svc.pipe = b
				}
			}
			_, err = io.Copy(&svc.pipe, f)
			svc.pipeLock.Unlock()
			if err != nil {
				svc.logger.Println("Error reading log file:", err)
				break
			}
			time.Sleep(1 * time.Second)
		}

		f.Close()
		close(done)
		time.Sleep(1 * time.Second)
	}
}
