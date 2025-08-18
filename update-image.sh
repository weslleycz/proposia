
set -e 

QUAY_USERNAME="${QUAY_USERNAME}"
QUAY_PASSWORD="${QUAY_PASSWORD}"
IMAGE_NAME="${IMAGE_NAME}"
QUAY_REPO="${QUAY_REPO}"
TAG="latest"
PLATFORM="linux/amd64"

echo "Iniciando o login no Quay.io..."

echo "$QUAY_PASSWORD" | docker login quay.io -u "$QUAY_USERNAME" --password-stdin

echo "Login realizado com sucesso!"

echo "Construindo a imagem Docker ($IMAGE_NAME:$TAG) para a plataforma $PLATFORM..."

docker buildx build --platform $PLATFORM --no-cache -t $IMAGE_NAME:$TAG --load .

echo "Imagem construída com sucesso!"

echo "Tagueando a imagem para o repositório Quay.io..."

docker tag $IMAGE_NAME:$TAG $QUAY_REPO:$TAG

echo "Enviando a imagem para $QUAY_REPO com a tag $TAG..."

docker push $QUAY_REPO:$TAG

echo "Imagem enviada com sucesso para o Quay.io!"

docker logout quay.io

echo "Processo finalizado."