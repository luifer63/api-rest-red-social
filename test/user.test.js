

const chai = require('chai')
const expect = chai.expect
const should = chai.should
const assert = chai.assert
const chaiHttp = require('chai-http')
const server = 'http://localhost:3900'

chai.use(chaiHttp)

const testUser = {
    email: "lvix2007@gmail.com",
    password: "password"
}

var auth =''


describe('Mi primera colección de test', () => {
    it('Testear dos valores', () => {
        let expectedValue = 10
        let actualValue = 10
        expect(actualValue).to.be.equal(expectedValue)        
    })

    it('Testear mi ruta prueba api', async() => {
        try {
            let response = await chai.request(server)
            .get('/ruta-prueba')
            assert.equal(response.status, 200)
            //expect(response.status).to.be.equal(200)
            
        } catch (error) {
            assert.fail(error)             
        }
    })

    it('Testear mi ruta Login', async() => {
        try {
            let response = await chai.request(server)
            .post('/api/user/login')
            .send(testUser)
            //assert.equal(response.status, 400)
            expect(response.status).to.be.equal(200)
            expect(response.body.token).to.be.a('String')
            auth = response.body.token
            
        } catch (error) {
            assert.fail(error)         
        }
    })

    it('Testear mi ruta prueba User', async() => {
        try {
            //console.log(auth)
            let response = await chai.request(server)
            .get('/api/user/prueba-user')
            .set({'Authorization': auth})
            expect(response.status).to.be.equal(200)
        } catch (error) {
            assert.fail(error)          
        }
    })

    


})