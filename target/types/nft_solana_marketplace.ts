export type NftSolanaMarketplace = {
  "version": "0.1.0",
  "name": "nft_solana_marketplace",
  "instructions": [
    {
      "name": "mintToken",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "mint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenMetadataProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "metadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "masterEdition",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "creatorKey",
          "type": "publicKey"
        },
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "symbol",
          "type": "string"
        },
        {
          "name": "uri",
          "type": "string"
        }
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "MintFailed",
      "msg": "Mint failed!"
    },
    {
      "code": 6001,
      "name": "MetadataCreateFailed",
      "msg": "Metadata account create failed!"
    },
    {
      "code": 6002,
      "name": "WrongMetadataOwner",
      "msg": "Metadata isn't owned by the metadata program"
    },
    {
      "code": 6003,
      "name": "WrongMasterEditionOwner",
      "msg": "Master Edition isn't owned by the metadata program"
    }
  ]
};

export const IDL: NftSolanaMarketplace = {
  "version": "0.1.0",
  "name": "nft_solana_marketplace",
  "instructions": [
    {
      "name": "mintToken",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "mint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenMetadataProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "metadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "masterEdition",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "creatorKey",
          "type": "publicKey"
        },
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "symbol",
          "type": "string"
        },
        {
          "name": "uri",
          "type": "string"
        }
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "MintFailed",
      "msg": "Mint failed!"
    },
    {
      "code": 6001,
      "name": "MetadataCreateFailed",
      "msg": "Metadata account create failed!"
    },
    {
      "code": 6002,
      "name": "WrongMetadataOwner",
      "msg": "Metadata isn't owned by the metadata program"
    },
    {
      "code": 6003,
      "name": "WrongMasterEditionOwner",
      "msg": "Master Edition isn't owned by the metadata program"
    }
  ]
};
