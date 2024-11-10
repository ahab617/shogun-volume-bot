const { Tokens } = require("../db/model");
const { Swap } = require("../db/model");

const findOne = async (props: any) => {
  try {
    const { filter } = props;
    const result = await Tokens.findOne(filter);
    return result;
  } catch (error) {
    throw new Error("Failed to find tokenSettingInfo");
  }
};

const create = async (tokenInfo: any) => {
  try {
    const newToken = new Tokens(tokenInfo);
    const newTokenSave = await newToken.save();
    return newTokenSave;
  } catch (error) {
    throw new Error("Failed to create tokenSettingInfo");
  }
};

const deleteOne = async (props: any) => {
  try {
    const { filter } = props;
    await Swap.deleteOne(filter);
    const result = await Tokens.deleteOne(filter);
    return result;
  } catch (error) {
    throw new Error("Failed to delete tokenSettingInfo");
  }
};

export default {
  findOne,
  create,
  deleteOne,
};
