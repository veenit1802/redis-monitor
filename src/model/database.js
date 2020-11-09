import pkg from 'sequelize';
import path from 'path';

const {Sequelize,DataTypes,Model}=pkg;
const __dirname=path.resolve();
console.log(__dirname);
const sequelize = new Sequelize({
    dialect:'sqlite',
    storage:path.join(__dirname,'src/model/store/database.sqlite'),
    logging:false
});

const User = sequelize.define(
    "Redis",{
        md5:{
            type:DataTypes.STRING,
            allowNull:false,
            primaryKey:true
        },
        host:{
            type:DataTypes.STRING,
            allowNull:false,
        },
        port:{
            type:DataTypes.INTEGER,
            allowNull:false,
        },
        password:{
            type:DataTypes.STRING,
        },
        add_time:{
            type:DataTypes.DATE
        },
        cdd_time:{
            type:DataTypes.DATE
        }

    },
    {
        updatedAt:"add_time",
        createdAt:"cdd_time",
    }
);

export {
    User
}