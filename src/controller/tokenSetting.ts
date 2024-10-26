
const { Tokens } = require('../db/model');
const { Swap } = require("../db/model");
const { Deposit } = require('../db/model');
const depositController = require('./deposit')

const findOne = async (props: any) => {
	const { filter } = props;
	const result = await Tokens.findOne(filter);
	return result;
} 

const create = async (tokenInfo: any) => {
    try {
        // const depositToken = {
        //     userId: tokenInfo.userId,
        //     tokenAddress: tokenInfo.publicKey
        // }
        // const r = await depositController.create(depositToken);
        // if(r.status == 200) {
            const newToken = new Tokens(
                tokenInfo
            );
            const newTokenSave = await newToken.save();
    
            return newTokenSave;
        // } else {
        //     return null;
        // }
    } catch (error) {
        return null;
    }
}

const deleteOne = async (props: any) => {
	const { filter } = props;
    await Swap.deleteOne(filter)
    const result = await Tokens.deleteOne(
		filter
	);
	return result;
}

export default {
    findOne,
	create,
	deleteOne
}