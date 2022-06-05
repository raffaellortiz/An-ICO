import Head from 'next/head';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import styles from '../styles/Home.module.css';
import Web3Modal from 'web3modal';
import { providers, BigNumber, Contract, utils } from 'ethers';
import { NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI } from '../constants';

export default function Home() {

  const zero = BigNumber.from(0);
  const [walletConnected, setWalletConnected] = useState(false);
  const [tokensMinted, setTokensMinted] = useState(zero);
  const [balanceOfDDTokens, setBalanceOfDDTokens] = useState(zero);
  const [tokenAmount, setTokenAmount] = useState(zero);
  const [loading, setLoading] = useState(false);
  const [tokensToBeClaimed, setTokensToBeClaimed] = useState(zero);
  const web3ModalRef = useRef();

  const getProviderOrSigner = async (needSigner = false) => {
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    const { chainId } = await web3Provider.getNetwork();

    if (chainId !== 4) {
      window.alert('Please connect to the Rinkeby testnet');
      throw new Error('Please connect to the Rinkeby testnet');
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (error) {
      console.error(error);
    }
  };

  const getTokensToBeClaimed = async () => {
    try {
      const provider = await getProviderOrSigner();
      const nftConstract = new Contract(
        NFT_CONTRACT_ADDRESS, 
        NFT_CONTRACT_ABI, 
        provider);
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider);
      const signer = await getProviderOrSigner(true);
      const userAddress = await signer.getAddress();
      const balance = await nftConstract.balanceOf(userAddress);

      if (balance === zero) { // balance === zero
        setTokensToBeClaimed(zero);
      } else {
        var amount = 0;
        for (var i = 0; i < balance; i++) { // i < balance
          const tokenId = nftConstract.tokenOfOwnerByIndex(userAddress, i);
          const claimed = await tokenContract.tokenIdsClaimed(tokenId);
          if (!claimed) {
            amount++;
          }
        }
        setTokensToBeClaimed(BigNumber.from(amount));
      }
    } catch (error) {
      console.error(error);
      setTokensToBeClaimed(zero);
    }
  };

  const getbalanceOfDDTokens = async () => {
    try {
      const provider = await getProviderOrSigner();
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );
      const signer = await getProviderOrSigner(true);
      const address = await signer.getAddress();
      const balance = await tokenContract.balanceOf(address);
      setBalanceOfDDTokens(balance);
    } catch (err) {
      console.error(err);
      setBalanceOfDDTokens(zero);
    }
  };

  const getTotalTokensMinted = async () => {
    try {
      const provider = await getProviderOrSigner();
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );
      const _tokensMinted = await tokenContract.totalSupply();
      setTokensMinted(_tokensMinted);
    } catch (error) {
      console.error(error);
    }
  };

  const mintDDToken = async (amount) => {
    try {
      const signer = await getProviderOrSigner(true);
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      );

      const value = 0.001 * amount;

      const tx = await tokenContract.mint(amount, {
        value: utils.parseEther(value.toString()),
      });

      setLoading(true);
      await tx.wait();
      setLoading(false);
      
      window.alert('Successfully minted DD token');

      await getbalanceOfDDTokens();
      await getTotalTokensMinted();
      await getTokensToBeClaimed();

    } catch (error) {
      console.error(error);
    }
  };

  const claimDDTokens = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      );
      const tx = await tokenContract.claim();
      setLoading(true);
      await tx.wait();
      setLoading(false);
      window.alert('Successfully claimed DD tokens');
      await getbalanceOfDDTokens();
      await getTotalTokensMinted();
      await getTokensToBeClaimed();
    } catch (error) {
      console.error(error);
    }
  }

  const renderButton = () => {
    if (loading) {
      return (
        <div>
          <button className={styles.button}>Loading...</button>
        </div>
      );
    }
    if (tokensToBeClaimed > 0) {
      return (
        <div>
          <div className={styles.description}>
            {tokensToBeClaimed * 10} Tokens can be claimed!
          </div>
          <button className={styles.button} onClick={claimDDTokens}>
            Claim Tokens
          </button>
        </div>
      );
    }
    return (
      <div style={{ display: "flex-col" }}>
        <div>
          <input
            type="number"
            placeholder="Amount of Tokens"
            onChange={(e) => setTokenAmount(BigNumber.from(e.target.value))}
            className={styles.input}
          />
        </div>

        <button
          className={styles.button}
          disabled={!(tokenAmount > 0)}
          onClick={() => mintDDToken(tokenAmount)}
        >
          Mint Tokens
        </button>
      </div>
    );
  };

  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: 'rinkeby',
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
      getbalanceOfDDTokens();
      getTotalTokensMinted();
      getTokensToBeClaimed();
    }
  }, [walletConnected]);

  return (
    <div>
      <Head>
        <title>Dragon Devs ICO</title>
        <meta name="description" content="ICO dApp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Dragon Devs ICO</h1>
          <div className={styles.description}>
            You can claim or mint Dragon Dev tokens here
          </div>
          {walletConnected ? (
              <div>
                <div className={styles.description}>
                  You have minted {utils.formatEther(balanceOfDDTokens)} Dragon Dev tokens.
                </div>
                <div className={styles.description}>
                  Overall {utils.formatEther(tokensMinted)} / 10000 have been mined
                </div>
                {renderButton()}
              </div>
            ) : (
              <button onClick={connectWallet} className={styles.button}>
                Connect your wallet
              </button>
            )
          }
        </div>
        <div >
          <img className={styles.image} src="./0.svg" />
        </div>
      </div>
      <footer className={styles.footer}>
        Made by Raffaello-SDE
      </footer> 
    </div>
  );
}
