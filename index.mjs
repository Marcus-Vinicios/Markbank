import chalk from 'chalk'
import fs from 'fs'
import inquirer from 'inquirer'

console.log(chalk.bgBlueBright.black('Iniciando o Markbank'))

function Home() {
    inquirer.prompt([
        {
            type: 'list',
            name: 'action',
            message: 'O que você deseja fazer? ',
            choices: ['Entrar', 'Criar Conta'],
        }
    ]).then((answer) => {
        const action = answer['action']
        if (action === 'Criar Conta') {
            console.log(chalk.bgGreen.black('Obrigado por escolher nosso Banco!'))
            console.log(chalk.green('Defina as opções da sua conta a seguir'))
            createAccount()
        }
        if (action === 'Entrar') {
            Login()
        }
    })
} Home()

function Login() {
    inquirer.prompt([
        {
            name: 'accountName',
            message: 'Qual o nome da sua conta?'
        }
    ])
        .then((answer) => {
            const accountName = answer['accountName']
            if (!checkAccount(accountName)) {
                inquirer.prompt([
                    {
                        type: 'list',
                        name: 'action',
                        message: 'O que você deseja fazer? ',
                        choices: ['Continuar', 'Criar Conta'],
                    },
                ])
                    .then((answer) => {
                        const action = answer['action']
                        if (action === 'Continuar') {
                            return Login()
                        } else if (action === 'Criar Conta') {
                            console.log(chalk.bgGreen.black('Obrigado por escolher nosso Banco!'))
                            console.log(chalk.green('Defina as opções da sua conta a seguir'))
                            return createAccount()
                        }
                    }).catch((err) => { console.log(err) })
            } else {
                return Operation(accountName)
            }
        })
        .catch(err => { console.log(err) })
}

function Operation(accountName) {
    const accountData = getAccount(accountName)
    const saldo = accountData.balance
    const overdraft = accountData.overdraft
    inquirer.prompt([
        {
            type: 'list',
            name: 'action',
            message: 'O que você deseja fazer? ',
            choices: ['Consultar Saldo', 'Depositar', 'Sacar', 'Sair'
            ],
        }
    ]).then((answer) => {
        const action = answer['action']
        if (action === 'Consultar Saldo') {
            ConsultarSaldo(accountName)
        }
        if (action === 'Depositar') {
            Depositar(accountName)
        }
        if (action === 'Sacar') {
            if (saldo === 0 && overdraft === 0) {
                console.log(chalk.bgRed.black('Não é possivel realizar um saque'))
                return Operation(accountName)
            } else {
                Sacar(accountName)
            }
        }
        if (action === 'Sair') {
            console.log(chalk.bgBlueBright.black('\nObrigado por usar o MarkBank'))
            process.exit()
        }
    }).catch((err) => { console.log(err) })
}

function createAccount() {
    inquirer.prompt([
        {
            name: 'accountName',
            message: 'Digite um nome para sua conta: '
        }
    ])
        .then((answer) => {
            const accountName = answer.accountName
            console.log(`Nome da conta: ${accountName}`)
            if (!fs.existsSync('accounts')) {
                fs.mkdir('accounts')
            }
            if (fs.existsSync(`accounts/${accountName}.json`)) {
                console.log(chalk.bgRed.black('Está conta já existe! Por favor escolha outro nome'))

                createAccount()
                return
            }
            fs.writeFileSync(`accounts/${accountName}.json`, '{"balance": 0}', (err) => {
                console.log(err)
            })
            console.log(chalk.green('Sua Conta foi criada com sucesso!'))
            Operation(accountName)
        })
        .catch(() => { console.log(err) })
}

function checkAccount(accountName) {
    if (!fs.existsSync(`accounts/${accountName}.json`)) {
        console.log(chalk.bgRed.black('Esta conta não existe! Tente novamente'))
        return false
    }
    return true
}

function ConsultarSaldo(accountName) {
    const accountData = getAccount(accountName)
    const saldo = accountData.balance
    const overdraft = accountData.overdraft
    console.log(chalk.bgBlueBright.black(`\nO seu saldo é de R$${saldo}`))
    console.log(chalk.bgBlueBright.black(`Cheque Especial: R$${overdraft}`))
    return Operation(accountName)
}

function Depositar(accountName) {
    inquirer.prompt([
        {
            name: 'amount',
            message: 'Qual o valor do depósito?'
        }
    ]).then((answer) => {
        const amount = answer['amount']
        //Realizar depósito
        addAmount(accountName, amount)
    }).catch((err) => { console.log(err) })
}

function Sacar(accountName) {
    inquirer.prompt([
        {
            name: 'amount',
            message: 'Qual o valor do saque?'
        }
    ]).then((answer) => {
        const amount = answer['amount']
        //Realizar saque
        Saque(accountName, amount)
    }).catch((err) => { console.log(err) })
}

function addAmount(accountName, amount) {
    const accountData = getAccount(accountName)
    if (!amount) {
        console.log(chalk.bgRed.black('Ocorreu um erro, tente novamente mais tarde!'))
        return Operation(accountName)
    }
    accountData.balance = parseFloat(amount) + parseFloat(accountData.balance)
    fs.writeFileSync(`accounts/${accountName}.json`, JSON.stringify(accountData), function (err) {
        console.log(err)
    })
    console.log(chalk.green(`Foi depositado o valor de R$${amount} na sua conta!`))
    Operation(accountName)
}

function Saque(accountName, amount) {
    const accountData = getAccount(accountName)
    const saldo = accountData.balance
    if (!amount) {
        console.log(chalk.bgRed.black('Ocorreu um erro, tente novamente mais tarde!'))
        return Operation(accountName)
    }
    if (saldo < amount) {
        console.log(chalk.bgRed.black('Valor indisponivel!'))
        inquirer.prompt([
            {
                type: 'list',
                name: 'action',
                message: 'Você deseja utilizar seu limite especial?',
                choices: ['Sim', 'Não'],
            }
        ])
            .then((answer) => {
                const action = answer['action']
                const overdraft = accountData.overdraft
                if (action === 'Sim') {
                    if (overdraft < amount) {
                        console.log(chalk.bgRed.black('Valor indisponivel!'))
                        return Sacar(accountName)
                    } else {
                        accountData.overdraft = parseFloat(accountData.overdraft) - parseFloat(amount)
                        fs.writeFileSync(`accounts/${accountName}.json`, JSON.stringify(accountData), function (err) {
                            console.log(err)
                        })
                        console.log(chalk.green(`Foi realizado um saque no valor de R$${amount} na sua conta!`))
                        console.log(chalk.bgYellowBright.black('Você utilizou o seu limite especial!'))
                        Operation(accountName)
                    }
                } else {
                    return Sacar(accountName)
                }
            })
            .catch(err => { console.log(err) })
    } else {
        accountData.balance = parseFloat(accountData.balance) - parseFloat(amount)
        fs.writeFileSync(`accounts/${accountName}.json`, JSON.stringify(accountData), function (err) {
            console.log(err)
        })
        console.log(chalk.green(`Foi realizado um saque no valor de R$${amount} na sua conta!`))
        Operation(accountName)
    }
}

function getAccount(accountName) {
    const accountJSON = fs.readFileSync(`accounts/${accountName}.json`, {
        encoding: 'utf-8',
        flag: 'r'
    })
    return JSON.parse(accountJSON)
}