# 第一阶段：构建 Go 应用
FROM golang:1.21-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制 go.mod 和 go.sum（如果存在）
COPY go.mod ./

# 下载依赖（本项目无外部依赖，但保留此步骤以符合最佳实践）
RUN go mod download

# 复制源代码
COPY main.go ./

# 编译 Go 程序
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o protobuf-msg-reader .

# 第二阶段：创建最小运行镜像
FROM alpine:latest

# 安装 ca-certificates（用于 HTTPS 请求）
RUN apk --no-cache add ca-certificates

# 设置工作目录
WORKDIR /app

# 从构建阶段复制编译好的二进制文件
COPY --from=builder /app/protobuf-msg-reader .

# 复制前端静态文件
COPY index.html ./
COPY style.css ./
COPY parser.js ./
COPY app.js ./

# 暴露端口
EXPOSE 8080

# 设置环境变量（可选）
ENV PORT=8080

# 运行应用
CMD ["./protobuf-msg-reader"]
