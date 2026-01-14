import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class User extends Model {
    declare public id: string;
    declare public username: string;
    declare public password: string;
    declare public name: string;
    declare public role: 'GUEST' | 'SUPPORT' | 'MENTOR';
}

User.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        role: {
            type: DataTypes.ENUM('GUEST', 'SUPPORT', 'MENTOR'),
            allowNull: false,
        },
    },
    {
        sequelize,
        modelName: 'User',
    }
);
