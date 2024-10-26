import { Raydium, TxVersion, parseTokenAccountResp } from '@raydium-io/raydium-sdk-v2'
import { Connection, Keypair, } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'
import {config} from '../../src/config'
import dotenv from 'dotenv';
export const connection = new Connection(config.rpcUrl) 
export const txVersion = TxVersion.V0 // or TxVersion.LEGACY
const cluster = 'mainnet' // 'mainnet' | 'devnet'

let raydium: Raydium | undefined
// export const initSdk = async (params?: { loadToken?: boolean }) => {
//   if (raydium) return raydium
//   console.log(`connect to rpc ${connection.rpcEndpoint} in ${cluster}`)
//   raydium = await Raydium.load({
//     owner,
//     connection,
//     cluster,
//     disableFeatureCheck: true,
//     disableLoadToken: !params?.loadToken,
//     blockhashCommitment: 'finalized',
    
//   })
//   return raydium
// }

export const fetchTokenAccountData = async (owner: Keypair) => {
  const solAccountResp = await connection.getAccountInfo(owner.publicKey)
  const tokenAccountResp = await connection.getTokenAccountsByOwner(owner.publicKey, { programId: TOKEN_PROGRAM_ID })
  const token2022Req = await connection.getTokenAccountsByOwner(owner.publicKey, { programId: TOKEN_2022_PROGRAM_ID })
  const tokenAccountData = parseTokenAccountResp({
    owner: owner.publicKey,
    solAccountResp,
    tokenAccountResp: {
      context: tokenAccountResp.context,
      value: [...tokenAccountResp.value, ...token2022Req.value],
    },
  })
  return tokenAccountData
}