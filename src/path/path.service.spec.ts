/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Test, TestingModule } from '@nestjs/testing';
import { PathService } from './path.service';
import axios from 'axios';
import * as BpmnModdle from 'bpmn-moddle';
import { HttpModule } from '@nestjs/axios';
import { HttpStatus } from '@nestjs/common';

// Mock axios and BpmnModdle
jest.mock('axios');
jest.mock('bpmn-moddle');

describe('PathService', () => {
  let service: PathService;
  let mockedAxios: jest.Mocked<typeof axios>;
  let mockedBpmnModdle: jest.MockedClass<typeof BpmnModdle>;
  const SIMPLE_BPMN_XML = `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL">
  <process id="testProcess" isExecutable="true">
    <startEvent id="start" />
    <sequenceFlow id="flow1" sourceRef="start" targetRef="end" />
    <endEvent id="end" />
  </process>
</definitions>`;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PathService],
      imports: [HttpModule],
    }).compile();

    service = module.get<PathService>(PathService);
    mockedAxios = axios as jest.Mocked<typeof axios>;
    mockedBpmnModdle = BpmnModdle as unknown as jest.MockedClass<
      typeof BpmnModdle
    >;
  });

  describe('findPath', () => {
    it('should find a path between start and end', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { bpmn20Xml: SIMPLE_BPMN_XML },
      });

      const fromXMLMock = jest.fn().mockResolvedValue({
        rootElement: {
          get: (key: string) =>
            key === 'rootElements'
              ? [
                  {
                    $type: 'bpmn:Process',
                    flowElements: [
                      { id: 'start', outgoing: [{ targetRef: { id: 'end' } }] },
                      { id: 'end', outgoing: [] },
                    ],
                  },
                ]
              : undefined,
        },
      });
      mockedBpmnModdle.mockImplementation(
        () => ({ fromXML: fromXMLMock }) as any,
      );

      const path = await service.findPath('start', 'end');

      expect(path).toEqual(['start', 'end']);
      expect(fromXMLMock).toHaveBeenCalledWith(SIMPLE_BPMN_XML);
    });

    it('should throw 404 when no path exists', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { bpmn20Xml: SIMPLE_BPMN_XML },
      });

      const fromXMLMock = jest.fn().mockResolvedValue({
        rootElement: {
          get: (key: string) =>
            key === 'rootElements'
              ? [
                  {
                    $type: 'bpmn:Process',
                    flowElements: [
                      { id: 'start', outgoing: [] },
                      { id: 'end', outgoing: [] },
                    ],
                  },
                ]
              : undefined,
        },
      });
      mockedBpmnModdle.mockImplementation(
        () => ({ fromXML: fromXMLMock }) as any,
      );

      await expect(service.findPath('start', 'end')).rejects.toMatchObject({
        response: 'No path found',
        status: HttpStatus.NOT_FOUND,
      });
    });

    it('should throw 400 for invalid node IDs', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { bpmn20Xml: SIMPLE_BPMN_XML },
      });

      const fromXMLMock = jest.fn().mockResolvedValue({
        rootElement: {
          get: (key: string) =>
            key === 'rootElements'
              ? [
                  {
                    $type: 'bpmn:Process',
                    flowElements: [
                      { id: 'start', outgoing: [] },
                      { id: 'end', outgoing: [] },
                    ],
                  },
                ]
              : undefined,
        },
      });
      mockedBpmnModdle.mockImplementation(
        () => ({ fromXML: fromXMLMock }) as any,
      );

      await expect(service.findPath('foo', 'end')).rejects.toThrow(
        'Invalid node ID',
      );
      await expect(service.findPath('start', 'bar')).rejects.toThrow(
        'Invalid node ID',
      );
    });

    it('should throw 502 on fetch failure', async () => {
      mockedAxios.get.mockRejectedValue(new Error('network failure'));
      await expect(service.findPath('start', 'end')).rejects.toMatchObject({
        response: 'Failed to fetch BPMN XML',
        status: HttpStatus.BAD_GATEWAY,
      });
    });
  });
});
