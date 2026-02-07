I want to do this:

- Users create a channel using the a `createChannelFunction()`
- Then they connect to clearnode and authenticates via a eip 712 challange using `connect()`
- Then an app session is being created with a server wallet which is the main wallet in this case. The main wallet will be in charge of distributing all the funds properly. This will be done using a `createAppSession()` function
- Then the matching happens completely offchain using `matchOrders()`
- Then the final allocation is being constructed and finalized onchain `finalize()`
