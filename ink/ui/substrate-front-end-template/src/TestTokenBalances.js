import React, { useEffect, useState } from 'react';
import { Table, Grid, Button } from 'semantic-ui-react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { useSubstrate } from './substrate-lib';
import TestTokenContract, { defaultGasLimit, displayTestToken } from "./TestTokenContract";

export default function Main (props) {
  const { api, keyring } = useSubstrate();
  const accounts = keyring.getPairs();
  const [balances, setBalances] = useState({});
  const testTokenContract = TestTokenContract(api);

  const updateBalanceOf = async (accountAddress) => {
    const result = await testTokenContract.query.balanceOf(accountAddress, 0, defaultGasLimit, accountAddress);
    return result.output.toNumber()
  }

  const updateBalances = async () => {
    let balancesOf = [];
    const pairs = await keyring.getPairs();
    await Promise.all(pairs.map(async (pair) => {
      balancesOf[pair.address] = await updateBalanceOf(pair.address);
      console.log(balancesOf[pair.address])
    }));
    setBalances(balancesOf);
  }

  useEffect(() => {
    const addresses = keyring.getPairs().map(account => account.address);
    let unsubscribeAll = null;

    api.query.system.account
      .multi(addresses, balances => {
        updateBalances();
      }).then(unsub => {
      unsubscribeAll = unsub;
    }).catch(console.error);

    return () => unsubscribeAll && unsubscribeAll();
  }, [api, keyring, setBalances]);

  return (
    <Grid.Column>
      <h1>Balances</h1>
      <Table celled striped size='small'>
        <Table.Body>{accounts.map(account =>
          <Table.Row key={account.address}>
            <Table.Cell width={3} textAlign='right'>{account.meta.name}</Table.Cell>
            <Table.Cell width={10}>
              <span style={{ display: 'inline-block', minWidth: '31em' }}>
                {account.address}
              </span>
              <CopyToClipboard text={account.address}>
                <Button
                  basic
                  circular
                  compact
                  size='mini'
                  color='blue'
                  icon='copy outline'
                />
              </CopyToClipboard>
            </Table.Cell>
            <Table.Cell width={3}>{
              balances && balances[account.address] &&
              displayTestToken(balances[account.address])
            }</Table.Cell>
          </Table.Row>
        )}
        </Table.Body>
      </Table>
    </Grid.Column>
  );
}
