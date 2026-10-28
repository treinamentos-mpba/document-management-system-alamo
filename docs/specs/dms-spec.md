# Especificação - Document Management System

## 1. Objetivo

Disponibilizar uma aplicação web simples para que um usuário envie, liste e baixe seus documentos, mantendo os arquivos no filesystem local e os metadados em memória.

## 2. Escopo

### Dentro do escopo

- Receber um arquivo por requisição de upload e armazená-lo localmente.
- Registrar e listar os metadados dos documentos durante a execução do backend.
- Restringir a listagem e o download ao identificador de usuário enviado na requisição.
- Permitir o download de um documento pelo seu identificador.
- Apresentar no frontend os fluxos de envio, listagem e download e seus estados de erro e carregamento.

### Fora do escopo

- Autenticação real, cadastro ou administração de usuários. O identificador de usuário definido nesta especificação é apenas demonstrativo.
- Persistência de metadados em banco de dados ou recuperação automática após reiniciar o backend.
- Armazenamento externo ou em nuvem, incluindo serviços de upload de terceiros.
- Versionamento, edição, compartilhamento, exclusão ou busca avançada de documentos.
- Paginação e filtros além do escopo do usuário atual.

## 3. Requisitos funcionais

| ID | Requisito | Critérios de aceitação |
| --- | --- | --- |
| RF-01 | O usuário pode enviar um documento. | A API recebe um arquivo no campo `file` de uma requisição `multipart/form-data`; cria um identificador único; grava o conteúdo em `backend/storage` usando Multer `diskStorage`; registra os metadados em memória; e responde com HTTP `201` e os metadados públicos. |
| RF-02 | O usuário pode listar os documentos enviados por ele. | A API exige `X-User-ID` não vazio e retorna HTTP `200` com uma coleção JSON, inclusive quando vazia. A coleção contém apenas documentos cujo `owner` corresponde ao identificador informado. |
| RF-03 | O usuário pode baixar um documento pelo identificador. | A API exige `X-User-ID`, confirma que o documento pertence ao usuário e responde HTTP `200` com o conteúdo binário como anexo e o nome original para download. Documento inexistente ou pertencente a outro usuário responde `404`. |
| RF-04 | O cliente recebe erros previsíveis. | Falhas de validação e de acesso retornam o formato JSON definido na seção 6; respostas de erro não expõem caminhos locais, stack traces ou detalhes internos. |
| RF-05 | O frontend permite acompanhar os fluxos principais. | O usuário consegue enviar um arquivo, ver a lista atualizada após o envio, iniciar um download e identificar estados de carregamento, lista vazia e erro. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Os arquivos devem ser gravados exclusivamente no filesystem local da aplicação em `backend/storage`, usando Multer com `diskStorage`. Não utilizar armazenamento externo ou serviço de upload de terceiros. |
| RNF-02 | Os metadados devem permanecer em memória nesta fase. Eles são perdidos ao reiniciar o processo; os arquivos no disco podem permanecer sem metadados e, portanto, ficar inacessíveis pela API. Não haverá reconstrução automática do índice. |
| RNF-03 | A aplicação deve seguir a Clean Architecture simples do projeto: `routes` delegam a `controllers`, que usam `services`, que dependem de `repositories`. Camadas internas não devem depender de Express ou de detalhes do frontend. |
| RNF-04 | O backend deve usar Node.js e Express com CommonJS; o frontend deve usar React e Vite com ESM. Nesta fase, o código permanece em JavaScript sem TypeScript. |
| RNF-05 | O frontend deve acessar a API com `fetch` pelo prefixo `/api`. No desenvolvimento, o proxy do Vite remove esse prefixo e encaminha a chamada ao backend local. |
| RNF-06 | O limite máximo de um arquivo é 50 MB decimais (50.000.000 bytes). Qualquer tipo de arquivo é aceito; o servidor deve disponibilizá-lo como anexo, sem renderizá-lo inline. |
| RNF-07 | Os nomes físicos dos arquivos devem ser gerados pelo servidor e não derivados diretamente de caminhos fornecidos pelo cliente. O nome original deve ser preservado apenas como metadado para exibição e download. |
| RNF-08 | Configurações operacionais, como a porta do backend e o limite de upload, devem ser definidas por variáveis de ambiente, com valores padrão documentados. A pasta de armazenamento permanece `backend/storage`, conforme a restrição do projeto. |
| RNF-09 | O backend deve tratar erros de entrada, leitura e escrita de arquivos nos limites do sistema. O runner de testes do backend é o `node:test`. |
| RNF-10 | O identificador `X-User-ID` não autentica nem verifica a identidade de quem faz a requisição. Esta especificação destina-se ao MVP de demonstração e não estabelece proteção de dados adequada para produção. |

## 5. Modelo de dados

### Metadados públicos do documento

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `id` | string | Sim | UUID gerado pelo servidor e usado nas rotas de listagem e download. |
| `originalName` | string | Sim | Nome original do arquivo enviado, preservado para exibição e para o nome sugerido no download. Não deve ser usado como caminho físico. |
| `size` | number | Sim | Tamanho do arquivo em bytes. Deve ser menor ou igual a 50.000.000. |
| `uploadedAt` | string | Sim | Data e hora UTC de recebimento, serializada em ISO 8601. |
| `owner` | string | Sim | Valor de `X-User-ID` associado ao documento. É um identificador demonstrativo, não uma identidade autenticada. |

Exemplo de representação JSON:

```json
{
  "id": "0d7b6d84-8f25-4bfc-a9de-e34c01042d9d",
  "originalName": "relatorio.pdf",
  "size": 24576,
  "uploadedAt": "2026-10-28T12:00:00.000Z",
  "owner": "usuario-demo"
}
```

### Dados internos de persistência

O repositório pode manter, além dos campos públicos, o nome físico gerado para o arquivo e o tipo de mídia informado no upload. Esses dados são internos: não devem expor o caminho absoluto ou relativo do filesystem nas respostas da API. O arquivo deve ser armazenado com nome opaco derivado do UUID, sem confiar no nome ou caminho informado pelo cliente. O índice de metadados é mantido em memória; não existe banco de dados nesta fase.

## 6. Contratos de API

### Convenções

- As rotas abaixo são relativas à API do backend. No frontend durante o desenvolvimento, são chamadas com o prefixo `/api`; por exemplo, `/api/documents`. O proxy do Vite remove `/api` antes de encaminhar a requisição ao backend.
- As operações de upload, listagem e download exigem o header `X-User-ID` com valor não vazio. A ausência ou valor em branco resulta em HTTP `400` (`USER_ID_REQUIRED`). O header serve apenas para escopo demonstrativo e não constitui autenticação.
- As respostas JSON usam `Content-Type: application/json; charset=utf-8`. Downloads retornam bytes, não JSON.
- Os horários são serializados em UTC no formato ISO 8601.

### `POST /upload`

Recebe um arquivo e cria os metadados do documento.

**Headers**

| Nome | Obrigatório | Descrição |
| --- | --- | --- |
| `X-User-ID` | Sim | Identificador demonstrativo do usuário dono. |
| `Content-Type` | Sim | `multipart/form-data`, incluindo o boundary gerado pelo cliente. |

**Corpo**

Campo multipart obrigatório `file`, com exatamente um arquivo. Qualquer tipo de arquivo é aceito, limitado a 50.000.000 bytes.

**Sucesso: HTTP `201 Created`**

Retorna diretamente o objeto de metadados públicos criado:

```json
{
  "id": "0d7b6d84-8f25-4bfc-a9de-e34c01042d9d",
  "originalName": "relatorio.pdf",
  "size": 24576,
  "uploadedAt": "2026-10-28T12:00:00.000Z",
  "owner": "usuario-demo"
}
```

**Erros**

- `400 Bad Request` (`USER_ID_REQUIRED`): header ausente ou em branco.
- `400 Bad Request` (`FILE_REQUIRED`): arquivo ausente ou requisição sem o campo `file`.
- `413 Payload Too Large` (`FILE_TOO_LARGE`): arquivo acima do limite.
- `415 Unsupported Media Type` (`MULTIPART_REQUIRED`): requisição não enviada como multipart/form-data.
- `500 Internal Server Error` (`UPLOAD_FAILED`): falha ao gravar o arquivo ou registrar os metadados. A API não deve responder sucesso se o documento não puder ser registrado.

### `GET /documents`

Lista os documentos do usuário identificado no header `X-User-ID`. Não possui paginação nesta fase.

**Sucesso: HTTP `200 OK`**

Retorna um objeto com a coleção `documents`. Uma coleção sem documentos é representada como array vazio.

```json
{
  "documents": [
    {
      "id": "0d7b6d84-8f25-4bfc-a9de-e34c01042d9d",
      "originalName": "relatorio.pdf",
      "size": 24576,
      "uploadedAt": "2026-10-28T12:00:00.000Z",
      "owner": "usuario-demo"
    }
  ]
}
```

**Erros**

- `400 Bad Request` (`USER_ID_REQUIRED`): header ausente ou em branco.
- `500 Internal Server Error` (`LIST_FAILED`): falha inesperada ao consultar o repositório em memória.

### `GET /documents/:id/download`

Retorna o conteúdo binário do documento identificado por `id`, desde que o `owner` corresponda ao `X-User-ID` da requisição.

**Sucesso: HTTP `200 OK`**

- Corpo: bytes do arquivo original.
- `Content-Type`: tipo de mídia associado ao upload; usar `application/octet-stream` quando não houver um tipo disponível.
- `Content-Disposition`: `attachment`, com `originalName` como nome sugerido e tratado com segurança para uso em header.
- `X-Content-Type-Options: nosniff`.

**Erros**

- `400 Bad Request` (`USER_ID_REQUIRED`): header ausente ou em branco.
- `400 Bad Request` (`INVALID_DOCUMENT_ID`): identificador em formato inválido.
- `404 Not Found` (`DOCUMENT_NOT_FOUND`): documento inexistente, pertencente a outro usuário ou sem arquivo físico disponível. A mesma resposta evita revelar a existência de documentos de outros usuários.
- `500 Internal Server Error` (`DOWNLOAD_FAILED`): falha inesperada ao ler ou transmitir o arquivo.

### Formato de erro

Erros de API que não sejam respostas binárias devem usar o mesmo formato e não incluir detalhes internos:

```json
{
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "O arquivo excede o limite permitido de 50 MB."
  }
}
```

O status HTTP é a fonte de classificação do erro; `code` é estável para tratamento pelo frontend, enquanto `message` é uma mensagem segura para apresentação ao usuário.

## 7. Decisões arquiteturais

- **Backend:** Node.js e Express em CommonJS. As rotas definem os endpoints e delegam aos controllers; controllers tratam HTTP e validação básica; services concentram regras do domínio; repositories mantêm metadados em memória e interagem com o filesystem local.
- **Upload:** Multer com `diskStorage` na fronteira HTTP. A pasta de destino é `backend/storage`; o nome físico é gerado pelo servidor a partir de identificador único. A API expõe o nome original como metadado, nunca o caminho local.
- **Persistência:** arquivos no disco local e metadados em memória. O reinício do processo apaga o índice; arquivos restantes podem ficar órfãos. Não criar mecanismo de reconstrução, banco de dados ou provedor externo no MVP.
- **Identificação do dono:** `X-User-ID` obrigatório nas três operações. O valor é usado apenas para associar, filtrar e autorizar operações no contexto demonstrativo; qualquer cliente pode falsificá-lo. Autenticação real fica fora do escopo.
- **Identificador de documento:** UUID gerado no servidor, independente do nome original do arquivo.
- **Validação de upload:** aceitar qualquer tipo de arquivo até 50.000.000 bytes; rejeitar ausência de arquivo, tipo de requisição incompatível e excesso de tamanho. Downloads são enviados como anexos.
- **Frontend:** aplicação React organizada em páginas, componentes e serviços. A camada de serviços usa `fetch` com `/api`; o proxy Vite remove o prefixo e encaminha ao backend local. A interface deve apresentar estados de carregamento, vazio, sucesso e erro.
- **Tratamento de erros:** controllers traduzem falhas conhecidas para os status e códigos definidos nesta especificação; respostas não devem revelar stack traces nem caminhos do filesystem.
- **Configuração e testes:** configuração operacional via variáveis de ambiente com defaults explícitos; testes de backend com `node:test`, cobrindo contratos e regras de acesso.

## 8. Plano de execução

As etapas abaixo descrevem a implementação futura do produto. Nesta entrega, somente esta especificação é produzida; nenhum arquivo de backend ou frontend faz parte da execução deste plano.

1. **Fundação do backend:** definir configuração, diretório local, limites do Multer e registro das rotas, preservando a estrutura de Clean Architecture.
2. **Persistência e regras de documentos:** implementar repositório de arquivos e metadados em memória, geração de UUID, associação ao dono e regras de upload, listagem e download.
3. **Contratos HTTP:** conectar controllers e serviços aos endpoints, validar headers e entradas e padronizar status e respostas de erro conforme a seção 6.
4. **Testes de backend:** cobrir sucesso, validações, limite de tamanho, isolamento por `X-User-ID`, ausência de arquivos e falhas de filesystem usando `node:test`.
5. **Serviço e interface do frontend:** consumir os contratos com `fetch` pelo proxy `/api` e oferecer os fluxos de upload, listagem e download com estados de carregamento, vazio e erro.
6. **Integração e verificação:** validar o percurso completo entre frontend e backend, conferir headers e downloads, executar a suíte de testes e atualizar a documentação caso os contratos aprovados mudem.

Cada etapa depende da anterior quando consome seus contratos. Mudanças nas decisões de autenticação ou persistência exigem revisão desta especificação antes de ampliar o escopo.