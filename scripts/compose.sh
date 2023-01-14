n=0
until [ "$n" -ge 100 ]; do
  docker compose -f ./docker/compose/docker-compose.yml --project-name self-tools up -d && break # substitute your command here
  n=$((n + 1))
  sleep 1
done
