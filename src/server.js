const express = require('express');
const { PrismaClient } = require('@prisma/client');
const client = require('prom-client');  // Adicionando prom-client para métricas


const prisma = new PrismaClient();
const app = express();
app.use(express.json());

// Criando um registrador padrão para métricas
const register = new client.Registry();

// Coleta de métricas padrão (como uso de CPU, memória, etc.)
client.collectDefaultMetrics({ register });

// Métrica customizada: contador de requisições HTTP
const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total de requisições HTTP',
  labelNames: ['method', 'route', 'status_code']
});

register.registerMetric(httpRequestCounter);

// Middleware para contar requisições HTTP
app.use((req, res, next) => {
  res.on('finish', () => {
    httpRequestCounter.inc({ method: req.method, route: req.path, status_code: res.statusCode });
  });
  next();
});

// Expor métricas no endpoint /metrics
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Endpoint para listar usuários
app.get('/users', async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

// Endpoint para criar novos usuários
app.post('/users', async (req, res) => {
  const { name, email } = req.body;
  const user = await prisma.user.create({
    data: { name, email },
  });
  res.json(user);
});

app.listen(4000, () => {
  console.log('Server running on port 4000');
});

