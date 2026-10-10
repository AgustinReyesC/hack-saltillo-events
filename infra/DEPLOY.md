# Despliegue del agente en AWS

Resumen del despliegue del agente de inventario sobre AWS usando Lambda
(imagen de contenedor), S3, EventBridge Scheduler y Secrets Manager,
provisionado con Terraform.

## Arquitectura

```
                    ┌─────────────────────┐
   events.jsonl ───▶│  S3 (ObjectCreated) │──┐
                    └─────────────────────┘  │
                                             ▼
                    ┌─────────────────────┐   ┌───────────────────────────┐
 EventBridge  ─────▶│  Lambda (contenedor) │──▶│ Secrets Manager           │
 Scheduler           │  hack-saltillo-...   │   │ gemini-api-key (runtime)  │
 (cada 10 min)       └─────────────────────┘   └───────────────────────────┘
                               │
                               ▼
                         CloudWatch Logs
```

Todo serverless. El estado del inventario se reconstruye en cada ejecución a
partir del archivo completo de eventos (no se persiste en DynamoDB).

## Recursos desplegados (us-east-1)

| Recurso | Identificador |
|---|---|
| Lambda | `hack-saltillo-events-agent` |
| ARN Lambda | `arn:aws:lambda:us-east-1:501264524998:function:hack-saltillo-events-agent` |
| Repositorio ECR | `501264524998.dkr.ecr.us-east-1.amazonaws.com/hack-saltillo-events-agent` |
| Imagen | tag `5bbab08` (git SHA) y `latest` |
| Bucket S3 | `hack-saltillo-events-events-501264524998` |
| Objeto de eventos | `s3://hack-saltillo-events-events-501264524998/events.jsonl` |
| Schedule | `hack-saltillo-events-audit` (`rate(10 minutes)`) |
| Secreto | `hack-saltillo-events-gemini-api-key` (solo lectura) |
| Log group | `/aws/lambda/hack-saltillo-events-agent` (14 días) |
| Rol Lambda | `hack-saltillo-events-agent-role` |
| Rol Scheduler | `hack-saltillo-events-scheduler-role` |

## Comportamiento

- **Evento S3 (`ObjectCreated`)**: al subir un `events.jsonl` al bucket, la
  Lambda descarga el archivo, lo valida y ejecuta el pipeline completo
  (inventario + consulta de auditoría con Gemini).
- **Evento programado (EventBridge Scheduler)**: cada 10 minutos la Lambda
  descarga el último `events.jsonl`, reconstruye el estado y ejecuta la
  auditoría (sin consulta IA adicional).
- **Secretos**: la API key de Gemini se obtiene en runtime desde Secrets
  Manager (`GEMINI_API_KEY_SECRET_ID`). Nunca se escribe en el tfstate ni en
  variables de entorno en texto plano.

## Archivos relevantes

| Archivo | Descripción |
|---|---|
| `Dockerfile` | Imagen multi-stage para Lambda (base `public.ecr.aws/lambda/nodejs:22`). |
| `.dockerignore` | Excluye `node_modules`, `dist`, `infra`, etc. del contexto de build. |
| `src/handler.ts` | Entrypoint Lambda (detecta evento S3 vs. programado). |
| `src/agent.ts` | Pipeline reutilizable (esquemas + consumo + resumen + IA). |
| `src/secrets.ts` | Obtención de la API key desde Secrets Manager (con caché). |
| `src/s3.ts` | Descarga de objetos S3 a `/tmp`. |
| `src/config.ts` | Resolución del directorio de esquemas. |
| `infra/*.tf` | Infraestructura Terraform. |
| `scripts/deploy.ps1` | Script de despliegue (build + terraform). |

## Pasos del despliegue ejecutado

1. `terraform init`
2. `terraform apply -target="aws_ecr_repository.lambda"` (crea el ECR primero)
3. `aws ecr get-login-password | docker login` contra el registro ECR
4. `docker build --provenance=false --platform=linux/amd64 -t <ecr>:<sha> .`
5. `docker push <ecr>:<sha>` (y tag `latest`)
6. `terraform apply -var="image_tag=<sha>"`

> En esta máquina Terraform y AWS CLI corren en Windows, mientras que Docker
> está dentro de WSL. El script `deploy.ps1` usa `docker` desde Windows y por
> eso no corre tal cual aquí; el despliegue se hizo combinando ambas.

## Verificación

```powershell
aws lambda invoke `
  --function-name hack-saltillo-events-agent `
  --payload "{}" --cli-binary-format raw-in-base64-out `
  response.json --region us-east-1
```

Respuesta esperada: `StatusCode 200`, `FunctionError: null` y
`{"statusCode":200,"body":"{\"status\":\"ok\",\"withAiQuery\":false}"}`.

Logs (UTF-8 para evitar problemas de encoding con emojis en Windows):

```powershell
$env:PYTHONUTF8=1
$stream = aws logs describe-log-streams `
  --log-group-name /aws/lambda/hack-saltillo-events-agent `
  --order-by LastEventTime --descending --max-items 1 `
  --query 'logStreams[0].logStreamName' --output text --region us-east-1
aws logs get-log-events `
  --log-group-name /aws/lambda/hack-saltillo-events-agent `
  --log-stream-name $stream --limit 60 `
  --query 'events[].message' --output text --region us-east-1
```

Resultado observado: descarga del JSONL, validación de eventos, resumen de
inventario (`p-101 / loc-A1 = 200`) y lectura correcta del secreto.

## Actualizar el agente

```powershell
# Editar código, luego reconstruir y re-aplicar:
.\scripts\deploy.ps1          # (adaptar a WSL) usa el SHA de git como tag
```

O manualmente: rebuild/push con un tag nuevo y
`terraform apply -var="image_tag=<nuevo-tag>"`.

## Destruir

```powershell
cd infra
terraform destroy
```

> El bucket tiene `force_destroy = true` y el ECR `force_delete = true`, por lo
> que se eliminan con su contenido.

## Notas

- Gemini devolvió un `503 UNAVAILABLE` ("high demand") en una invocación: es un
  error transitorio del proveedor, gestionado con `try/catch` en
  `AIService`. Un reintento suele resolverlo.
- `node_modules/` y `dist/` están en `.gitignore`; siguen trackeados en el
  historial antiguo del repo (pendiente de limpieza si se desea).
- La API key expuesta en el incidente anterior debe rotarse en Google AI Studio
  y actualizarse en Secrets Manager.
