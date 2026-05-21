# Documento de Especificação Técnico-Funcional (PRD)
**Projeto:** App de Fidelização Chef Domingues  
**Versão:** 1.0 (MVP)  
**Objetivo:** Reter clientes, incentivar a partilha orgânica e executar estratégias de promoção cruzada entre os restaurantes do grupo no Mar Shopping Loulé.

---

## 1. Contexto do Cliente e Desafios de Negócio

* **Chef Domingues:** Opera uma academia de cozinha (workshops/eventos) e dois restaurantes no Mar Shopping (Loulé): uma pizzaria e o *Portuguese Lab* (comida típica portuguesa). Está em vias de abrir um terceiro espaço focado em arroz ("arroz malandrinho").
* **Desafio Comercial:** O *Portuguese Lab* regista ocupação máxima constante, enquanto a pizzaria apresenta baixa ocupação. A app deve funcionar como motor de promoção cruzada para desviar tráfego entre lojas.
* **Desafio Tecnológico:** Integração complexa e de alto custo com o sistema POS legado (WinRest). O MVP contorna isto com um modelo de validação síncrona para ganho de pontos e um fluxo manual assistido pelo staff para o resgate de ofertas.

---

## 2. Direção Visual & UI Guidelines (Estilo: "Premium Casual")

* **Paleta de Cores:**
  * **Base Neutra:** Branco quente (`#F8F8F6`) para fundos e cinza carvão (`#2D2D2D`) para textos principais, garantindo excelente contraste sob luz solar direta.
  * **Cor de Acento:** Dourado Sóbrio (`#CCA35F`) para botões primários, ícones ativos e realce de pontos, transmitindo sofisticação acessível.
* **Tipografia:** Serifada elegante para títulos principais (evocando a assinatura do Chef) e Sans-serif limpa/moderna para interfaces, menus e textos regulamentares.
* **Elementos Gráficos:** Linhas florais e botânicas douradas muito subtis em marca de água nos fundos. Foco absoluto em fotografia editorial de comida real e de alta qualidade, evitando ícones genéricos.

---

## 3. Jornadas do Utilizador (User Journeys)

### Jornada A: Primeiro Contacto & Onboarding
1. O utilizador instala e abre a app.
2. O sistema deteta o idioma automaticamente (com opção de alteração manual).
3. O utilizador regista-se via Telefone (OTP) ou E-mail.
4. Define preferências e concede consentimentos legais segmentados.

### Jornada B: Acumulação de Pontos (Modelo Eficiente)
1. Após efetuar o pagamento, o cliente acede à tab central "Ganhar".
2. Apresenta o seu QR Code único de cliente ao sensor/leitor do balcão (ou digita o código curto de fallback).
3. O backend valida a compra síncronamente via Conector WinRest (verifica se o talão existe, valor e se já foi pontuado).
4. Os pontos são creditados na carteira com confirmação visual imediata.

### Jornada C: Resgate de Recompensas (MVP sem Integração Profunda)
1. O cliente escolhe uma recompensa disponível no catálogo e faz o *claim*.
2. A app deduz os pontos e gera um voucher digital com QR Code e regras de utilização.
3. No balcão, o funcionário acede ao "Modo Staff" na sua própria app e faz o scan do QR Code do cliente.
4. O sistema valida o voucher e o funcionário aplica o respetivo desconto de forma manual no POS WinRest.

### Jornada D: Promoções Cruzadas (Modelo PANS)
1. O cliente (ex: utilizador frequente do *Portuguese Lab*) recebe uma notificação push: *"Amanhã: 20% de desconto na Pizzaria"*.
2. Ao abrir, acede a uma landing page interna e clica em `Activar`.
3. O sistema gera o voucher, mas aplica uma restrição temporal: o código só fica ativo a partir das 00:00h do dia seguinte.

### Jornada E: Partilha Social Segura (Anti-Fraude)
1. O utilizador partilha a app através da *Share Sheet* nativa para ganhar pontos extra.
2. O sistema valida no backend se o utilizador tem compras registadas nas últimas semanas e se não excedeu o limite semanal de pontos por partilha antes de atribuir a recompensa.

---

## 4. Especificação de Funcionalidades por Módulo

### 4.1 Módulo de Autenticação & Onboarding
* **Carrossel Informativo:** Painel de 3 slides com paginação por pontos. Botões `Próximo`, `Começar Agora` e `Saltar`.
* **Registo/Login:** Autenticação por número de telemóvel (SMS OTP), E-mail/Password ou *Google Sign-In*.
* **Configuração de Perfil:** Campos para Nome e Apelido. Checkboxes obrigatórias independentes para RGPD (Termos/Privacidade vs. Comunicações de Marketing).

### 4.2 Tab 1: Home (Painel Principal)
* **Painel de Pontos:** Saudação dinâmica ("Olá, Maria!") com exibição destacada do saldo atualizado.
* **Banner de Campanha Dinâmico:** Espaço configurável para campanhas programadas de promoção cruzada (Modelo PANS - válido apenas a partir do dia seguinte).
* **Carrossel de Restaurantes:** Atalhos para os cartões das lojas (*Portuguese Lab*, *Pizza Lab* e *Arrozeria*). O clique direciona para o respetivo Menu Digital (menus estritamente em formato texto para carregamento instantâneo).

### 4.3 Tab 2: Carteira (Wallet & Histórico)
* **Filtros de Transação:** Segmentação por abas superiores: `Todos`, `Ganhos` e `Usados`.
* **Histórico de Atividade:** Lista vertical com logótipo do restaurante, contexto/data (ex: "Almoço - 15 Mai") e variação de pontos (`+X Pontos` a dourado ou `-X Pontos` a cinzento escuro).

### 4.4 Tab 3: Ganhar Pontos (Identificador do Cliente)
* **QR Code de Cliente:** Identificador dinâmico do ID de utilizador para leitura nos sensores do balcão.
* **Código de Contingência:** String alfanumérica curta (ex: `A3B2-C4D5-E6F7`) com botão nativo de `Copiar Código` para digitação manual em caso de falha do leitor.

### 4.5 Tab 4: Recompensas (Catálogo & Gamificação)
* **Barra de Metas (Milestones):** Indicador visual de progresso com marcadores fixos (ex: `300 pts`, `600 pts`, `900 pts`) e ícones do tipo de prémio correspondente.
* **Catálogo Vertical:** Lista de cartões com fotos de comida, descrição da oferta, custo em pontos e botão de ação para resgate (*Claim*).

### 4.6 Tab 5: Conta (Definições & Área Técnica)
* **Gestão de Perfil:** Visualização de dados e navegação para sub-ecrãs: `Editar Perfil`, `Notificações`, `Definições`, `Ajuda`, `Termos` e `Privacidade`.
* **Botão Sair:** Log out seguro com limpeza de tokens de sessão (JWT).
* **Acesso à Área Staff:** Clique prolongado (3 segundos) no logótipo principal abre um teclado numérico (*Keypad*) para introdução do PIN de validação dos funcionários.

---

## 5. Modo Staff (Validação no Balcão)

* **Autenticação Local:** Validação por PIN de 4 dígitos independente por loja.
* **Câmara do Funcionário:** Interface simplificada de scanner para ler o voucher apresentado pelo cliente.
* **Ecrã de Resultados Triplo:**
  * **Válido (Verde):** Mostra a oferta e instrui o staff: *"Voucher Válido. Aplique a tecla [Desconto App] manualmente no POS."* Altera o estado do voucher para usado no backend.
  * **Já Utilizado (Vermelho):** Bloqueia a transação e exibe aviso de duplicado.
  * **Fora de Validade (Amarelo):** Indica se o voucher expirou ou se ainda não atingiu a data ativa (campanhas cruzadas para o dia seguinte).

---

## 6. Arquitetura de Integração & Tratamento de Erros

### 6.1 Validação com POS Legado (WinRest)
O backend da app deve comunicar com o Conector WinRest para certificar que o documento de venda apresentado é legítimo, corresponde à loja correta e ainda não foi associado a nenhuma pontuação na base de dados.

### 6.2 Tratamento de Exceções Obrigatório (Front-end)
* **Talão já processado:** *"Este talão já foi utilizado para acumular pontos."*
* **Timeout/Conector Offline (Picos de Verão):** *"Não conseguimos validar o teu talão de momento devido ao elevado volume de pedidos. Tenta novamente dentro de minutos ou introduz o código manualmente."*
* **Quebra de rede do cliente:** *"Sem ligação à rede. O teu progresso será atualizado assim que recuperares o sinal."*

---

## 7. Requisitos Não-Funcionais

* **Elasticidade de Layout (Internacionalização):** Elementos de UI com propriedades de *text wrapping* ou truncagem controlada (`text-overflow: ellipsis`), prevenindo que strings traduzidas para Francês ou Inglês (que ocupam até 30% mais espaço) quebrem o design.
* **Acessibilidade Físico-Visual:**
  * Alvos de toque (*Touch Targets*) com dimensão mínima de **44x44 dp/px**.
  * Rácio de contraste em conformidade com a norma **WCAG AA** para assegurar a leitura sob luz solar direta (esplanadas e zonas comuns do Mar Shopping).