# EventHub – Plataforma de Gerenciamento de Eventos

EventHub é uma aplicação web desenvolvida para facilitar a descoberta, o gerenciamento e a participação em eventos. Ideal para usuários que buscam atividades e para produtores que desejam divulgar e administrar seus próprios eventos de forma simples e eficiente.

💡 **Sobre o Projeto**

A plataforma oferece uma experiência completa para gerenciar eventos, desde a criação e divulgação até a compra de ingressos e interação do usuário. Os eventos podem ser buscados e filtrados, e os usuários podem gerenciar suas contas, ingressos e eventos favoritos. A aplicação também inclui um painel administrativo para gerenciamento geral. Utiliza Node.js com Express no backend, EJS para renderização dinâmica de páginas e MySQL para persistência de dados, garantindo uma solução robusta e escalável.

🚀 **Tecnologias Utilizadas**

*   **Backend:** Node.js, Express.js
*   **Frontend (View Engine):** EJS (Embedded JavaScript templates)
*   **Banco de Dados:** MySQL (com o driver `mysql2`)
*   **Gerenciamento de Sessão:** `express-session`
*   **Hashing de Senhas:** `bcrypt`
*   **Upload de Arquivos:** `multer` (para imagens de eventos)
*   **Gerenciador de Pacotes:** npm

⚙️ **Funcionalidades**

*   **Navegação e Busca:** Explore eventos futuros na página inicial ou use a busca por título.
*   **Detalhes do Evento:** Visualize informações completas de cada evento.
*   **Autenticação:** Cadastro, login e logout seguros para usuários.
*   **Painel do Usuário:** Gerencie perfil, veja ingressos comprados, acesse favoritos e registre-se como produtor.
*   **Compra de Ingressos:** Funcionalidade para adquirir ingressos para eventos.
*   **Feedback:** Usuários podem enviar feedback sobre eventos que participaram.
*   **Favoritos:** Marque eventos de interesse para acesso rápido.
*   **Painel do Produtor:** Crie, edite e exclua eventos; visualize feedback dos seus eventos.
*   **Painel Administrativo:** Gerencie usuários, eventos, categorias e feedbacks da plataforma (requer login de administrador).

🛠️ **Como executar localmente**

1.  **Pré-requisitos:**
    *   Instale Node.js e npm: [https://nodejs.org/](https://nodejs.org/)
    *   Instale e configure um servidor MySQL: [https://www.mysql.com/](https://www.mysql.com/)

2.  **Clone o repositório (ou copie os arquivos):**
    *   Se você tiver um repositório git, clone-o. Caso contrário, certifique-se de que todos os arquivos fornecidos (`app.js`, `package.json`, etc.) estejam em um diretório de projeto.
    ```bash
    # Exemplo se fosse um repositório git
    # git clone <url-do-seu-repositorio>
    cd <diretorio-do-projeto>
    ```

3.  **Instale as dependências:**
    *   No terminal, dentro do diretório do projeto, execute:
    ```bash
    npm install
    ```

4.  **Configure o Banco de Dados:**
    *   Crie um banco de dados MySQL chamado `eventhub`.
    *   Execute o script `eventhub.sql` fornecido para criar as tabelas necessárias. Você pode usar um cliente MySQL como o MySQL Workbench ou a linha de comando:
        ```bash
        mysql -u seu_usuario -p eventhub < eventhub.sql
        ```
        (Substitua `seu_usuario` pelo seu nome de usuário do MySQL).
    *   Verifique e, se necessário, ajuste as credenciais de conexão no arquivo `config/db.js` (ou `db.js` se estiver na raiz) para corresponder à sua configuração do MySQL (host, usuário, senha, nome do banco).
        *   **Nota:** O arquivo `db.js` fornecido assume conexão em `localhost`, usuário `root`, senha vazia e database `eventhub`.

5.  **Execute a Aplicação:**
    *   No terminal, dentro do diretório do projeto, execute:
    ```bash
    npm start
    ```
    *   A aplicação estará disponível em `http://localhost:3000` (ou a porta definida no `app.js`).

📁 **Estrutura do Projeto (Inferida)**

Com base nos arquivos fornecidos, a estrutura provável do projeto é:

```
eventhub/
├── config/             # Arquivos de configuração (ex: db.js)
│   └── db.js
├── controllers/        # Lógica de controle das rotas
│   ├── adminController.js
│   ├── authController.js
│   ├── dashboardController.js
│   ├── eventsController.js
│   ├── generosController.js
│   └── producerController.js
├── middleware/         # Middlewares (ex: ensureLogin.js)
│   └── ensureLogin.js
├── public/             # Arquivos estáticos (CSS, JS do cliente, imagens)
│   └── uploads/        # Diretório para uploads de imagens
├── routes/             # Definição das rotas da aplicação
│   ├── admin/
│   │   ├── categories.js
│   │   ├── events.js
│   │   └── feedbacks.js
│   ├── admin.js
│   ├── auth.js
│   ├── dashboard.js
│   ├── events.js
│   └── generos.js
├── views/              # Arquivos de template EJS
│   ├── partials/       # (Possivelmente, para header/footer)
│   ├── admin/          # (Possivelmente, views da área admin)
│   ├── dashboard/      # (Possivelmente, views do dashboard)
│   ├── index.ejs
│   ├── login.ejs
│   ├── register.ejs
│   └── ...             # Outras views .ejs
├── app.js              # Ponto de entrada principal da aplicação
├── eventhub.sql        # Script SQL para criação do banco de dados
├── package.json        # Metadados e dependências do projeto
├── package-lock.json   # Lockfile das dependências
└── README.md           # Este arquivo
```

📌 **Observações Importantes**

*   Certifique-se de que o servidor MySQL esteja em execução antes de iniciar a aplicação Node.js.
*   As credenciais de administrador para acessar `/admin` podem precisar ser criadas manualmente no banco de dados após a configuração inicial.
*   O upload de imagens de eventos é gerenciado pelo `multer` e os arquivos são salvos em `public/uploads/`.

🔮 **Possíveis Expansões Futuras**

*   Implementação de sistema de pagamento para ingressos.
*   Melhorias na interface do usuário (UI/UX).
*   Notificações para usuários sobre eventos favoritos ou novos eventos.
*   Sistema de avaliação/rating para eventos.
*   Funcionalidades sociais (compartilhamento, comentários em eventos).
*   Testes automatizados.

🧠 **Autor**
Desenvolvido por Caio Rosa e Pedro Israel, estudantes de Engenharia de Software.
