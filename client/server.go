package main

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"io/ioutil"
	"net/http"
	"strings"
	"time"

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
