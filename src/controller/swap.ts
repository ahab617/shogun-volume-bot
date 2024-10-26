
// const { Swap } = require('../db/model');

// const findOne = async (props: any) => {
// 	const { filter } = props;
// 	const result = await Swap.findOne(filter);
// 	return result;
// } 
// const swapInfo = async () => {
//     const result = await Swap.aggregate([
//         {
//             $lookup: {
//               from: "wallets",          
//               localField: "userId",    
//               foreignField: "userId",        
//               as: "swapDetails"       
//             }
//           }
//     ]);
// 	return result;
// } 
// const create = async (tokenInfo: any) => {
//     try {
//         console.log(tokenInfo)
//         const newToken = new Swap(tokenInfo)
//         const newTokenSave = await newToken.save();
//         return newTokenSave;
//     } catch (error) {
//         return null;
//     }
// }
// const updateOne = async (props:any) => {
//     const result = await Swap.findOneAndUpdate({userId: props.userId}, {
//         $set: {
//             volume: props.volume
//         } 
//     });
//     return result;
// }
// const deleteOne = async (props: any) => {
//     console.log(props)
// 	const { filter } = props;
// 	const result = await Swap.deleteOne(
// 		filter
// 	);
// 	return result;
// }
// export default {
//     findOne,
// 	create,
// 	deleteOne,
//     swapInfo,
//     updateOne
// }

const { Swap } = require('../db/model');

// Find a single swap entry based on filter
const findOne = async (props: any) => {
    const { filter } = props;
    try {
        const result = await Swap.findOne(filter);
        if (result) {
            return { status: 200, data: result };
        } else {
            return { status: 404, message: ' Swap Information not found.\n\n Please Set up the Volume.\n\n <b>Command Line: </b> /activity' };
        }
    } catch (error) {
        console.error('Error finding swap:', error);
        return { status: 500, message: 'Internal server error. Please try again a later.' };
    }
}

// Get swap information and join with wallet details
const swapInfo = async () => {
    try {
        const result = await Swap.aggregate([
            {
                $lookup: {
                    from: "wallets",          
                    localField: "userId",     
                    foreignField: "userId",   
                    as: "swapDetails"        
                }
            }
        ]);
        return { status: 200, data: result };
    } catch (error) {
        console.error('Error in swapInfo aggregation:', error);
        return { status: 500, message: 'Internal server error' };
    }
}

// Create a new swap entry
const create = async (tokenInfo: any) => {
    try {
        console.log('Creating new swap:', tokenInfo);
        const newToken = new Swap(tokenInfo);
        const newTokenSave = await newToken.save();
        if (newTokenSave) {
            return { status: 200, message: 'Swap created successfully', data: newTokenSave };
        } else {
            return { status: 500, message: 'Failed to save new swap' };
        }
    } catch (error) {
        console.error('Error creating swap:', error);
        return { status: 500, message: 'Internal server error' };
    }
}

// Update a specific swap's volume based on userId
const updateOne = async (props: any) => {
    try {
        const result = await Swap.findOneAndUpdate(
            { userId: props.userId },       
            { $set: { volume: props.volume } }, 
            { new: true }                     
        );
        if (result) {
            return { status: 200, message: 'Swap updated successfully', data: result };
        } else {
            return { status: 404, message: 'Swap not found' };
        }
    } catch (error) {
        console.error('Error updating swap:', error);
        return { status: 500, message: 'Internal server error' };
    }
}


const deleteOne = async (props: any) => {
	const { filter } = props;
	const result = await Swap.deleteOne(
		filter
	);
	return result;
}

export default {
    findOne,
    create,
    deleteOne,
    swapInfo,
    updateOne
}
