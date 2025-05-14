/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import * as BpmnModdle from 'bpmn-moddle';

import { FlowElementsContainer, FlowNode } from 'bpmn-moddle';
import axios from 'axios';

interface BpmnProcess extends FlowElementsContainer {
  flowElements: FlowNode[];
}
@Injectable()
export class PathService {
  private elementsById: Record<string, FlowNode> = {};
  private adjacency: Record<string, string[]> = {};
  private readonly BPMN_API_URL =
    'https://n35ro2ic4d.execute-api.eu-central-1.amazonaws.com/prod/engine-rest/process-definition/key/invoice/xml';

  constructor(private readonly httpService: HttpService) {}

  /**
   * Public API to orchestrate the steps
   */
  public async findPath(from: string, to: string): Promise<string[]> {
    if (!from || !to) {
      throw new HttpException(
        'Both "from" and "to" parameters are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const xml = await this.fetchBpmnXml();
    await this.parseXml(xml);

    if (!this.elementsById[from] || !this.elementsById[to]) {
      throw new HttpException('Invalid node ID', HttpStatus.BAD_REQUEST);
    }

    const path: string[] = [];
    const found = this.dfs(from, to, new Set(), path);

    if (!found) {
      throw new HttpException('No path found', HttpStatus.NOT_FOUND);
    }

    return path;
  }

  /**
   * 1. Fetch the BPMN XML from the API
   */
  private async fetchBpmnXml(): Promise<string> {
    try {
      const response = await axios.get<{ id: string; bpmn20Xml: string }>(
        this.BPMN_API_URL,
      );
      const xml = response?.data?.bpmn20Xml;
      if (!xml) {
        throw new Error('Missing XML');
      }
      return xml;
    } catch {
      throw new HttpException(
        'Failed to fetch BPMN XML',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * 2. Parse the XML using bpmn-moddle (callback API) and build graph
   */

  private async parseXml(xml: string): Promise<void> {
    // Parse XML into Definitions (promise API)
    try {
      const moddle = new BpmnModdle();

      const { rootElement }: any = await moddle.fromXML(xml);

      // Identify BPMN process
      const processEl = rootElement
        .get('rootElements')
        ?.find((el: any) => el.$type === 'bpmn:Process') as BpmnProcess;

      if (!processEl?.flowElements) {
        throw new HttpException(
          'No process definition found',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Build elementsById and adjacency list
      this.elementsById = {};
      this.adjacency = {};

      for (const element of processEl.flowElements) {
        if (!element || !('id' in element)) continue;
        this.elementsById[element.id] = element;

        const outgoing = (element as unknown as { outgoing?: unknown })
          .outgoing;
        this.adjacency[element.id] = Array.isArray(outgoing)
          ? (outgoing as Array<{ targetRef?: { id?: string } }>)
              .map((flow) => flow.targetRef?.id)
              .filter((id): id is string => Boolean(id))
          : [];
      }
    } catch (error) {
      console.error('Error parsing BPMN XML:', error);
      throw new HttpException(
        'Failed to parse BPMN XML',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
  /**
   * 3. Find a path between two nodes using DFS
   */
  private dfs(
    current: string,
    target: string,
    visited: Set<string>,
    path: string[],
  ): boolean {
    if (visited.has(current)) return false;
    visited.add(current);
    path.push(current);

    if (current === target) return true;

    for (const neighbor of this.adjacency[current] || []) {
      if (this.dfs(neighbor, target, visited, path)) {
        return true;
      }
    }

    path.pop();
    return false;
  }
}
