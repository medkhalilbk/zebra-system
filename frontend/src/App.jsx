import { useState, useEffect } from 'react'
import {
  ChakraProvider,
  Box,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  VStack,
  HStack,
  Text,
  Tag,
  useToast,
  Spinner,
  Badge,
  Divider,
  Code,
  Switch,
  extendTheme,
  FormHelperText,
  Alert,
  AlertIcon,
} from '@chakra-ui/react'

const theme = extendTheme({
  styles: {
    global: {
      body: {
        bg: 'gray.50',
        color: 'gray.800',
      },
    },
  },
})

function App() {
  const [tagCount, setTagCount] = useState(5)
  const [interval, setInterval] = useState(1)
  const [tags, setTags] = useState([])
  const [latestPayload, setLatestPayload] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [loading, setLoading] = useState(false)
  const [useMQTT, setUseMQTT] = useState(true)
  const [useWebhook, setUseWebhook] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState('')

  const toast = useToast()

  useEffect(() => {
    if (!useMQTT) {
      setTags([])
      setLatestPayload(null)
      return
    }
    const websocket = new WebSocket('ws://localhost:8000/ws/tags')
    websocket.onopen = () => console.log('WebSocket connected')
    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data?.tag_reads) {
        if(!isRunning) {setIsRunning(true)}
        setTags(prev => [...data.tag_reads, ...prev].slice(0, 50))
        setLatestPayload(data)
      }
    }
    websocket.onclose = () => console.log('WebSocket disconnected')
    return () => websocket.close()
  }, [useMQTT])

  const startSimulation = async () => {
    if (!useMQTT && !useWebhook) {
      toast({
        title: 'Select at least one source',
        description: 'Please enable MQTT, Webhook, or both to start simulation.',
        status: 'warning',
        duration: 4000,
        isClosable: true,
      })
      return
    }

    setLoading(true)
    try {
      const res = await fetch('http://localhost:8000/api/start_simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
        tag_count: parseInt(tagCount),
    interval: parseFloat(interval),
    webhook_url: useWebhook ? webhookUrl : null,
        }),
      })
      if (res.ok) {
        setIsRunning(true)
        toast({ title: 'Simulation started', status: 'success', duration: 3000 })
      } else {
        throw new Error((await res.json()).detail || 'Failed to start simulation')
      }
    } catch (err) {
      toast({ title: 'Error', description: err.message, status: 'error', duration: 3000 })
    } finally {
      setLoading(false)
    }
  }

  const stopSimulation = async () => {
    setLoading(true)
    try {
      const res = await fetch('http://localhost:8000/api/stop_simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (res.ok) {
        setIsRunning(false)
        toast({ title: 'Simulation stopped', status: 'info', duration: 3000 })
      } else {
        throw new Error((await res.json()).detail || 'Failed to stop simulation')
      }
    } catch (err) {
      toast({ title: 'Error', description: err.message, status: 'error', duration: 3000 })
    } finally {
      setLoading(false)
    }
  }

  return (
    <ChakraProvider theme={theme}>
      <Box p={8} maxW="full" mx="auto" bg="white" shadow="xl" borderRadius="xl">
        <Heading mb={6} textAlign="center" color="blue.600">
          Zebra FX9600 RFID Simulator
        </Heading>


        <Box p={4} bg="gray.100" borderRadius="lg" mb={6}>
          <HStack justify="space-between">
            <Text fontWeight="bold">Simulation Status</Text>
            <Tag size="lg" colorScheme={isRunning ? 'green' : 'gray'}>
              {isRunning ? 'Running' : 'Idle'}
            </Tag>
          </HStack>
        </Box>

        {/* Source Selection */}
        <Box p={4} bg="gray.50" borderRadius="md" mb={6} boxShadow="sm">
          <Heading size="sm" mb={2}>
            Select Data Source
          </Heading>
          <HStack spacing={6}>
            <FormControl display="flex" alignItems="center" maxW="160px">
              <FormLabel htmlFor="mqtt" mb="0">
                MQTT
              </FormLabel>
              <Switch
                id="mqtt"
                isChecked={useMQTT}
                onChange={() => setUseMQTT(!useMQTT)}
                isDisabled={isRunning}
              />
            </FormControl>

            <FormControl display="flex" alignItems="center" maxW="160px">
              <FormLabel htmlFor="webhook" mb="0">
                Webhook
              </FormLabel>
              <Switch
                id="webhook"
                isChecked={useWebhook}
                onChange={() => setUseWebhook(!useWebhook)}
                isDisabled={isRunning}
              />
            </FormControl>
            
          </HStack>
{useWebhook && (
  <FormControl mt={4}>
    <FormLabel>Webhook URL</FormLabel>
    <Input
      placeholder="https://your-webhook-endpoint"
      value={webhookUrl}
      onChange={(e) => setWebhookUrl(e.target.value)}
      isDisabled={isRunning}
    />
    <FormHelperText>
      The server will POST JSON data to this URL on every emission.
    </FormHelperText>
  </FormControl>
)}
          {/* Important : FormHelperText must be inside FormControl */}
          <FormControl>
            <FormHelperText mt={2} color="gray.600" maxW="400px">
              Choose one or both data sources for simulation.
            </FormHelperText>
          </FormControl>

          {!useMQTT && !useWebhook && (
            <Alert status="warning" mt={2}>
              <AlertIcon />
              Please select at least one source to enable simulation.
            </Alert>
          )}
        </Box>

        {/* Main horizontal split: Left = controls + table, Right = JSON viewer */}
        <HStack spacing={8} align="start">
          {/* Left side */}
          <Box flex="1" minW="0">
            <VStack spacing={4} align="stretch" mb={8}>
              <HStack spacing={6}>
                <FormControl isDisabled={isRunning}>
                  <FormLabel>Tags per Cycle</FormLabel>
                  <Input
                    type="number"
                    value={tagCount}
                    onChange={(e) => setTagCount(e.target.value)}
                  />
                </FormControl>

                <FormControl isDisabled={isRunning}>
                  <FormLabel>Interval (s)</FormLabel>
                  <Input
                    type="number"
                    step="0.1"
                    value={interval}
                    onChange={(e) => setInterval(e.target.value)}
                  />
                </FormControl>
              </HStack>

              <HStack spacing={4}>
                <Button
                  colorScheme="blue"
                  onClick={startSimulation}
                  isDisabled={isRunning || (!useMQTT && !useWebhook)}
                  isLoading={loading}
                  px={8}
                >
                  Start
                </Button>

                <Button
                  colorScheme="red"
                  onClick={stopSimulation}
                  isDisabled={!isRunning}
                  isLoading={loading}
                  px={8}
                >
                  Stop
                </Button>
              </HStack>
            </VStack>

            <Divider mb={4} />
            <Heading size="md" mb={4}>
              Last 50 Tag Reads
            </Heading>

            {tags.length === 0 && isRunning && <Spinner size="lg" label="Receiving tags..." />}

            {tags.length > 0 && (
              <Box overflowX="auto" maxH="600px" overflowY="auto">
                <Table size="sm" variant="striped" colorScheme="gray">
                  <Thead>
                    <Tr>
                      <Th>EPC</Th>
                      <Th>Antenna</Th>
                      <Th>RSSI</Th>
                      <Th>Seen Count</Th>
                      <Th>Channel</Th>
                      <Th>Timestamp</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {tags.map((tag, index) => (
                      <Tr key={index}>
                        <Td fontFamily="mono">{tag.epc}</Td>
                        <Td>
                          <Badge colorScheme="purple">#{tag.antennaPort}</Badge>
                        </Td>
                        <Td>
                          <Badge colorScheme="red">{tag.peakRssi} dBm</Badge>
                        </Td>
                        <Td>{tag.seenCount}</Td>
                        <Td>{tag.channelIndex}</Td>
                        <Td>{tag.timeStamp}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            )}
          </Box>

          {/* Right side: JSON live view */}
          <Box
            flex="1"
            minW="0"
            bg="gray.900"
            color="green.300"
            fontFamily="mono"
            p={4}
            borderRadius="lg"
            maxH="600px"
            overflowY="auto"
            whiteSpace="pre-wrap"
            boxShadow="inner"
          >
            <Heading size="md" mb={4} color="green.300">
              Live JSON Payload
            </Heading>
            <Code whiteSpace="pre-wrap" width="100%" height="100%">
              {latestPayload ? JSON.stringify(latestPayload, null, 2) : 'Waiting for data...'}
            </Code>
          </Box>
        </HStack>
      </Box>
    </ChakraProvider>
  )
}

export default App
