import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import { spawn, ChildProcess } from 'child_process'

// Server instance for testing
let serverProcess: ChildProcess | null = null
const SERVER_PORT = 3001
const BASE_URL = `http://localhost:${SERVER_PORT}`

// Test data
const testUser = {
  username: 'testuser123',
  email: 'test@example.com',
  password: 'TestPassword123!'
}

describe.skip('Authentication API Integration Tests (Requires Server)', () => {
  beforeAll(async () => {
    // Start the API server
    serverProcess = spawn('node', ['src/server.cjs'], {
      stdio: 'pipe',
      env: { ...process.env, PORT: SERVER_PORT.toString() }
    })
    
    // Wait for server to start
    await new Promise((resolve) => {
      setTimeout(resolve, 2000)
    })
  }, 10000)

  afterAll(async () => {
    // Stop the server
    if (serverProcess) {
      serverProcess.kill('SIGTERM')
      await new Promise((resolve) => {
        serverProcess!.on('close', resolve)
      })
    }
  })

  beforeEach(async () => {
    // Clean up test user before each test
    try {
      await request(BASE_URL)
        .delete(`/api/admin/users/cleanup`)
        .send({ username: testUser.username, email: testUser.email })
    } catch (error) {
      // Ignore cleanup errors
    }
  })

  describe('User Registration Flow', () => {
    it('should register a new user with valid data', async () => {
      const response = await request(BASE_URL)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201)

      expect(response.body).toMatchObject({
        success: true,
        message: 'User registered successfully'
      })
      
      expect(response.body.data).toBeDefined()
      expect(response.body.data.user).toMatchObject({
        username: testUser.username,
        email: testUser.email
      })
      expect(response.body.data.token).toBeDefined()
      expect(response.body.data.user.password).toBeUndefined()
    })

    it('should reject registration with invalid email format', async () => {
      const invalidUser = { ...testUser, email: 'invalid-email' }
      
      const response = await request(BASE_URL)
        .post('/api/auth/register')
        .send(invalidUser)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('validation')
    })

    it('should reject registration with weak password', async () => {
      const weakUser = { ...testUser, password: '123' }
      
      const response = await request(BASE_URL)
        .post('/api/auth/register')
        .send(weakUser)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('password')
    })

    it('should reject duplicate username registration', async () => {
      // Register user first time
      await request(BASE_URL)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201)

      // Try to register same username
      const duplicateUser = { ...testUser, email: 'different@example.com' }
      
      const response = await request(BASE_URL)
        .post('/api/auth/register')
        .send(duplicateUser)
        .expect(409)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('exists')
    })
  })

  describe('User Login Flow', () => {
    beforeEach(async () => {
      // Register a user for login tests
      await request(BASE_URL)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201)
    })

    it('should login with valid credentials', async () => {
      const response = await request(BASE_URL)
        .post('/api/auth/login')
        .send({
          emailOrUsername: testUser.username,
          password: testUser.password
        })
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: 'Login successful'
      })
      
      expect(response.body.data.user).toMatchObject({
        username: testUser.username,
        email: testUser.email
      })
      expect(response.body.data.token).toBeDefined()
    })

    it('should login with email instead of username', async () => {
      const response = await request(BASE_URL)
        .post('/api/auth/login')
        .send({
          emailOrUsername: testUser.email,
          password: testUser.password
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.user.email).toBe(testUser.email)
    })

    it('should reject login with invalid credentials', async () => {
      const response = await request(BASE_URL)
        .post('/api/auth/login')
        .send({
          emailOrUsername: testUser.username,
          password: 'wrongpassword'
        })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('Invalid')
    })

    it('should reject login for non-existent user', async () => {
      const response = await request(BASE_URL)
        .post('/api/auth/login')
        .send({
          emailOrUsername: 'nonexistent',
          password: testUser.password
        })
        .expect(401)

      expect(response.body.success).toBe(false)
    })
  })

  describe('Protected Route Access', () => {
    let authToken: string

    beforeEach(async () => {
      // Register and login to get token
      await request(BASE_URL)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201)
      
      const loginResponse = await request(BASE_URL)
        .post('/api/auth/login')
        .send({
          emailOrUsername: testUser.username,
          password: testUser.password
        })
        .expect(200)
      
      authToken = loginResponse.body.data.token
    })

    it('should access protected route with valid token', async () => {
      const response = await request(BASE_URL)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.user).toMatchObject({
        username: testUser.username,
        email: testUser.email
      })
    })

    it('should reject access without token', async () => {
      const response = await request(BASE_URL)
        .get('/api/auth/me')
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('token')
    })

    it('should reject access with invalid token', async () => {
      const response = await request(BASE_URL)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)

      expect(response.body.success).toBe(false)
    })

    it('should refresh token successfully', async () => {
      const response = await request(BASE_URL)
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.token).toBeDefined()
      expect(response.body.data.token).not.toBe(authToken)
    })
  })

  describe('Session Management', () => {
    let authToken: string

    beforeEach(async () => {
      await request(BASE_URL)
        .post('/api/auth/register')
        .send(testUser)

      const loginResponse = await request(BASE_URL)
        .post('/api/auth/login')
        .send({
          emailOrUsername: testUser.username,
          password: testUser.password
        })
      
      authToken = loginResponse.body.data.token
    })

    it('should logout successfully', async () => {
      const response = await request(BASE_URL)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('Logout successful')
    })

    it('should invalidate token after logout', async () => {
      // Logout first
      await request(BASE_URL)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      // Try to access protected route with old token
      const response = await request(BASE_URL)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(401)

      expect(response.body.success).toBe(false)
    })

    it('should change password successfully', async () => {
      const newPassword = 'NewPassword456!'
      
      const response = await request(BASE_URL)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: testUser.password,
          newPassword: newPassword
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      
      // Verify can login with new password
      const loginResponse = await request(BASE_URL)
        .post('/api/auth/login')
        .send({
          emailOrUsername: testUser.username,
          password: newPassword
        })
        .expect(200)

      expect(loginResponse.body.success).toBe(true)
    })

    it('should reject password change with wrong current password', async () => {
      const response = await request(BASE_URL)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'NewPassword456!'
        })
        .expect(400)

      expect(response.body.success).toBe(false)
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed JSON gracefully', async () => {
      const response = await request(BASE_URL)
        .post('/api/auth/register')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400)

      expect(response.body.success).toBe(false)
    })

    it('should handle missing required fields', async () => {
      const response = await request(BASE_URL)
        .post('/api/auth/register')
        .send({
          username: testUser.username
          // Missing email and password
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('validation')
    })

    it('should enforce rate limiting on registration', async () => {
      // Attempt rapid registrations
      const promises = Array.from({ length: 12 }, (_, i) => 
        request(BASE_URL)
          .post('/api/auth/register')
          .send({
            username: `testuser${i}`,
            email: `test${i}@example.com`,
            password: testUser.password
          })
      )

      const responses = await Promise.allSettled(promises)
      
      // Some requests should be rate limited (429)
      const rateLimitedResponses = responses.filter(result => 
        result.status === 'fulfilled' && 
        (result.value as any).status === 429
      )
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0)
    })
  })
})