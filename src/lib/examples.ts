export const SAMPLE_PUDGE_TX_HASH = '0xcfad00f9954110b0fc28f850c8c8b7bc7191fd276bdcb43ba1fbff3d8f3b1507'

export const SAMPLE_PUDGE_MULTI_INPUT_TX_HASH = '0xaa17b8e6b5fdda24b406718038b2ddeabeafc5989fff24bf9679ff7b3a5012c6'

export const PUDGE_TRANSACTION_EXAMPLES = [
  {
    id: 'simple',
    label: 'Cellbase sample',
    summary: 'cellbase / 1 output',
    hash: SAMPLE_PUDGE_TX_HASH,
    expectedInputs: 1,
    expectedOutputs: 1,
  },
  {
    id: 'multi-input',
    label: 'Multi-input sample',
    summary: '3 inputs / 3 outputs',
    hash: SAMPLE_PUDGE_MULTI_INPUT_TX_HASH,
    expectedInputs: 3,
    expectedOutputs: 3,
  },
] as const

export type PudgeTransactionExample = (typeof PUDGE_TRANSACTION_EXAMPLES)[number]
