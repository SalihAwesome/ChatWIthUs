import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = process.env.DATABASE_URL || 'mysql://root:root@127.0.0.1:3306/support_chat';

const sequelize = new Sequelize(dbUrl, {
    dialect: 'mysql',
    logging: false,
    define: {
        timestamps: true,
    },
});

export default sequelize;
