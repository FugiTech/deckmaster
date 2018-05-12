package main

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"strings"
	"time"

	_ "net/http/pprof"

	_ "github.com/fugiman/deckmaster/client/statik"
	"github.com/rakyll/statik/fs"
)

func (svc *service) server() error {
	statikFS, err := fs.New()
	if err != nil {
		svc.logger.Println("error loading statik filesystem:", err)
		return err
	}
	http.Handle("/", http.FileServer(statikFS))

	http.HandleFunc("/auth", func(w http.ResponseWriter, r *http.Request) {
		token := r.FormValue("token")
		svc.token.Store(parseToken(token))
		ioutil.WriteFile(tokenFilename, []byte(token), 0664)
		fmt.Fprint(w, "GIF89a\x01\x00\x01\x00\x80\x01\x00\xFF\xFF\xFF\x00\x00\x00\x2C\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02\x44\x01\x00\x3B")
	})

	http.HandleFunc("/data", func(w http.ResponseWriter, r *http.Request) {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"version": VERSION,
			"status": map[string]interface{}{
				"Twitch": svc.pubsubStatus.Load(),
				"Arena":  svc.arenaStatus.Load(),
			},
		})
	})

	server := http.Server{
		Addr:     "127.0.0.1:22223",
		ErrorLog: svc.logger,
	}
	go func() {
		<-svc.ctx.Done()
		server.Close()
	}()
	return server.ListenAndServe()
}

func parseToken(token string) Token {
	t := Token{JWT: token}

	p := strings.Split(token, ".")
	if len(p) < 2 {
		return t
	}

	d, err := base64.URLEncoding.DecodeString(p[1])
	if err != nil {
		return t
	}

	var m map[string]interface{}
	dec := json.NewDecoder(bytes.NewReader(d))
	dec.UseNumber()
	err = dec.Decode(&m)
	if err != nil {
		return t
	}

	t.ChannelID, _ = m["channel_id"].(string)

	exp, _ := m["exp"].(json.Number)
	exp2, _ := exp.Int64()
	t.Expires = time.Unix(exp2, 0)

	return t
}
