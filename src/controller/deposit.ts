
// const { Deposit } = require('../db/model');


// const findOne = async (props: any) => {
// 	const { filter } = props;
// 	const result = await Deposit.findOne(filter);
// 	return result;
// } 
// const create = async (tokenInfo: any) =>  {
//     try {
//         const isUser = await Deposit.findOne({
//             userId: tokenInfo.userId
//         });
//         if(isUser){
//             if(isUser.tokenAddress.length > 0 && isUser.tokenAddress.filter((item: any)=> item === tokenInfo.tokenInfo).length > 0){
//                 return {status: 202}
//             }else {
//                 isUser.tokenAddress.push(tokenInfo.tokenInfo);
//                 const result = await Deposit.findOneAndUpdate({userId: tokenInfo.userId}, {
//                     $set: {
//                         tokenAddress: isUser.tokenAddress
//                     } 
//                 });
//                 if(result) {
//                     return {status: 200}
//                 }else {
//                     return {status: 201}
//                 }
//             }
//         }else {
//             let arr = [];
//             arr[arr.length] = tokenInfo.tokenInfo
//             const newToken = new Deposit({
//                 userId: tokenInfo.userId,
//                 tokenAddress: arr
//             });
//             const newTokenSave = await newToken.save();
//             if(newTokenSave) {
//                 return {status: 200}
//             }else {
//                 return {status: 201}
//             }
//         }
        
//     } catch (error) {
//         return {status: 500}
//     }
// }

// export default {
//     findOne,
// 	create,
// }

const { Deposit } = require('../db/model');

const findOne = async (props: any) => {
    const { filter } = props;
    try {
        const result = await Deposit.findOne(filter);
        return result;
    } catch (error) {
        console.error('Error finding deposit:', error);
        throw new Error('Failed to find deposit');
    }
}

const create = async (tokenInfo: any) => {
    try {
        // Check if the user already exists
        const userDeposit = await Deposit.findOne({ userId: tokenInfo.userId });
        
        if (userDeposit) {
            // Check if the token address already exists in the user's record
            const tokenExists = userDeposit.tokenAddress.includes(tokenInfo.tokenInfo);

            if (tokenExists) {
                return { status: 202, message: 'Token address already exists' };
            } else {
                // Add the new token address and update the document
                userDeposit.tokenAddress.push(tokenInfo.tokenInfo);
                const updateResult = await Deposit.findOneAndUpdate(
                    { userId: tokenInfo.userId },
                    { $set: { tokenAddress: userDeposit.tokenAddress } },
                    { new: true }  // Return the updated document
                );
                if (updateResult) {
                    return { status: 200, message: 'Token address updated successfully' };
                } else {
                    return { status: 201, message: 'Failed to update token address' };
                }
            }
        } else {
            // If the user doesn't exist, create a new deposit record
            const newDeposit = new Deposit({
                userId: tokenInfo.userId,
                tokenAddress: [tokenInfo.tokenInfo]  // Create an array with the new token
            });
            
            const saveResult = await newDeposit.save();
            if (saveResult) {
                return { status: 200, message: 'New deposit created successfully' };
            } else {
                return { status: 201, message: 'Failed to create new deposit' };
            }
        }
    } catch (error) {
        console.error('Error creating/updating deposit:', error);
        return { status: 500, message: 'Internal server error' };
    }
}

export default {
    findOne,
    create,
}
