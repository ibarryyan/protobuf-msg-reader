package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
)

const (
	// 默认端口
	DefaultPort = "8080"
	// 静态文件目录
	StaticDir = "."
)

func main() {
	// 获取端口号，优先使用环境变量
	port := os.Getenv("PORT")
	if port == "" {
		port = DefaultPort
	}

	// 创建文件服务器
	fs := http.FileServer(http.Dir(StaticDir))

	// 设置路由
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// 添加 CORS 头（跨域支持）
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		// 如果请求根路径，返回 index.html
		if r.URL.Path == "/" {
			http.ServeFile(w, r, filepath.Join(StaticDir, "index.html"))
			return
		}

		// 其他请求使用文件服务器处理
		fs.ServeHTTP(w, r)
	})

	// 健康检查端点
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		fmt.Fprintf(w, `{"status":"ok","service":"protobuf-msg-reader"}`)
	})

	// 启动服务器
	addr := ":" + port
	log.Printf("🚀 Protocol Buffer 消息解析器服务启动")
	log.Printf("📡 服务地址: http://localhost%s", addr)
	log.Printf("📁 静态文件目录: %s", StaticDir)
	log.Printf("✨ 按 Ctrl+C 停止服务\n")

	if err := http.ListenAndServe(addr, nil); err != nil {
		log.Fatalf("❌ 服务器启动失败: %v", err)
	}
}
